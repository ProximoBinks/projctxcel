import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { adelaideTimestamp } from "../lib/adelaideDate";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";

const stripe = vi.hoisted(() => ({ create: vi.fn(), retrieve: vi.fn(), cancel: vi.fn() }));
vi.mock("stripe", async () => {
  const actual = await vi.importActual<typeof import("stripe")>("stripe");
  return { default: class { paymentIntents = stripe; webhooks = new actual.default("sk_test_fixture").webhooks; } };
});
vi.mock("../convex/discord", () => ({ sendDiscordNotification: vi.fn() }));
const modules = import.meta.glob("../convex/**/*.{ts,js}");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const adminId = await ctx.db.insert("tutorAccounts", { name: "Admin", email: "admin@example.com", passwordHash: "fixture", hourlyRate: 3000, active: true, roles: ["admin"] });
    const studentId = await ctx.db.insert("students", { name: "Student", yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
    const profileId = await ctx.db.insert("billingProfiles", { studentId, paymentType: "card", status: "active", stripeCustomerId: "cus_test", stripePaymentMethodId: "pm_test", createdAt: Date.now() });
    const classId = await ctx.db.insert("classes", { name: "English", subject: "English", yearLevel: "Year 12", dayOfWeek: "Monday", startTime: "10:00", endTime: "11:00", hourlyRateCents: 3000, active: true, createdAt: Date.now() });
    await ctx.db.insert("classStudents", { classId, studentId, active: true, assignedAt: Date.now() });
    return { adminId, studentId, profileId };
  });
  const admin = t.withIdentity({ subject: ids.adminId, type: "admin", tutorAccountId: ids.adminId, roles: ["admin"] });
  const input = { adminId: ids.adminId, studentId: ids.studentId, amountCents: 3000, description: "Lesson", requestId: "stable-payment-request-001" };
  return { t, admin, input, ...ids };
}

async function queueReviewedDay(fixture: Awaited<ReturnType<typeof setup>>, date = "2026-10-26") {
  const { t, admin } = fixture;
  vi.setSystemTime(adelaideTimestamp(date, "18:00"));
  const dayId = await admin.mutation(api.billingReview.prepareToday, {});
  await t.mutation(internal.billingReview.preparePage, { dayId });
  const rows = (await admin.query(api.billingReview.lessons, { date, paginationOpts: { numItems: 50, cursor: null } })).page;
  await admin.mutation(api.billingReview.approve, { reviews: rows.map(row => ({ id: row._id, version: row.version })) });
  vi.setSystemTime(adelaideTimestamp(date));
  await t.mutation(internal.billingReview.dispatchPage, { dayId });
  return (await t.run(ctx => ctx.db.query("billingOperations").order("desc").first()))!._id;
}

describe("durable billing operations", () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture"); vi.resetAllMocks();
    stripe.create.mockImplementation(async (args, options) => ({ ...args, id: `pi_${options.idempotencyKey}`, status: "succeeded" }));
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

  it("deduplicates concurrent manual requests and stores one charge", async () => {
    const { t, admin, input } = await setup();
    await Promise.all([admin.action(api.stripeActions.manualCharge, input), admin.action(api.stripeActions.manualCharge, input)]);
    expect(stripe.create).toHaveBeenCalledTimes(1);
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(1);
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(1);
    expect((await admin.action(api.stripeActions.manualCharge, input)).success).toBe(true);
    expect(stripe.create).toHaveBeenCalledTimes(1);
  });

  it("rejects reusing a request ID for a different payment", async () => {
    const { admin, input } = await setup();
    await admin.action(api.stripeActions.manualCharge, input);
    await expect(admin.action(api.stripeActions.manualCharge, { ...input, amountCents: 4000 })).rejects.toThrow(/different payment/);
    expect(stripe.create).toHaveBeenCalledTimes(1);
  });

  it("recovers a lost response using the original Stripe key and frozen parameters", async () => {
    const { t, admin, input } = await setup();
    stripe.create.mockRejectedValueOnce(new Error("network timeout"));
    const first = await admin.action(api.stripeActions.manualCharge, input);
    expect(first.status).toBe("uncertain");
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(0);
    const second = await admin.action(api.stripeActions.manualCharge, input);
    expect(second.success).toBe(true);
    expect(stripe.create.mock.calls[0]).toEqual(stripe.create.mock.calls[1]);
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(1);
  });

  it("does not recreate an unknown payment after the Stripe retention window", async () => {
    const { admin, input } = await setup();
    stripe.create.mockRejectedValue(new Error("timeout"));
    const result = await admin.action(api.stripeActions.manualCharge, input);
    vi.setSystemTime(Date.now() + 24 * 60 * 60_000);
    const check = await admin.action(api.stripeActions.checkCharge, { operationId: result.operationId! });
    expect(check.status).toBe("uncertain");
    expect(check.error).toMatch(/expired/);
    expect(stripe.create).toHaveBeenCalledTimes(1);
  });

  it("recovers after a worker stops before local finalization", async () => {
    const { t, admin, input } = await setup();
    const { adminId: _id, ...args } = input;
    const operationId = await admin.mutation(internal.billingOperations.prepareManual, args);
    const operation = await t.mutation(internal.billingOperations.claim, { operationId });
    await t.run(ctx => ctx.db.patch(operationId, { stripePaymentIntentId: "pi_existing" }));
    stripe.retrieve.mockResolvedValue({ id: "pi_existing", amount: operation!.chargeCents, currency: "aud", customer: "cus_test", metadata: { billingOperationId: operationId }, status: "succeeded" });
    vi.setSystemTime(Date.now() + 61_000);
    expect((await t.action(internal.stripeActions.processBillingOperation, { operationId })).success).toBe(true);
    expect(stripe.create).not.toHaveBeenCalled();
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(1);
  });

  it("reserves credit across approved operations and settles credit and charge exactly once", async () => {
    const fixture = await setup();
    const { t, admin, adminId, studentId } = fixture;
    await admin.mutation(api.billing.addCredit, { adminId, studentId, amountCents: 5000, description: "Credit" });
    const a = await queueReviewedDay(fixture);
    const b = await queueReviewedDay(fixture, "2026-11-02");
    const operations = await t.run(ctx => ctx.db.query("billingOperations").collect());
    expect(operations.reduce((sum, op) => sum + op.creditCents, 0)).toBe(5000);
    expect(await admin.query(api.billing.getStudentCreditBalance, { studentId })).toBe(0);
    await t.mutation(internal.billingOperations.finish, { operationId: a!, status: "succeeded" });
    await t.mutation(internal.billingOperations.finish, { operationId: a!, status: "succeeded" });
    await t.mutation(internal.billingOperations.finish, { operationId: b!, status: "failed", error: "Declined" });
    const debit = await t.run(ctx => ctx.db.query("billingCredits").collect());
    expect(debit.filter(c => c.amountCents < 0)).toHaveLength(1);
    expect(debit.find(c => c.amountCents < 0)?.billingChargeId).toBeDefined();
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(2);
  });

  it("keeps uncertain credit reserved and repeated dispatch does not create another operation", async () => {
    const fixture = await setup();
    const { t, admin, adminId, studentId } = fixture;
    await admin.mutation(api.billing.addCredit, { adminId, studentId, amountCents: 1000, description: "Credit" });
    const operationId = await queueReviewedDay(fixture);
    const day = await admin.query(api.billingReview.day, { date: "2026-10-26" });
    await t.mutation(internal.billingReview.dispatchPage, { dayId: day.summary!._id });
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(1);
    await t.mutation(internal.billingOperations.finish, { operationId: operationId!, status: "uncertain", error: "Timeout" });
    expect(await admin.query(api.billing.getStudentCreditBalance, { studentId })).toBe(0);
  });

  it("cancels an incomplete intent before permitting a retry and deduplicates retry clicks", async () => {
    const { t, admin, input } = await setup();
    stripe.create.mockImplementationOnce(async args => ({ ...args, id: "pi_declined", status: "requires_payment_method" }));
    stripe.cancel.mockImplementation(async id => ({ ...stripe.create.mock.calls[0][0], id, status: "canceled" }));
    expect((await admin.action(api.stripeActions.manualCharge, input)).status).toBe("failed");
    expect(stripe.cancel).toHaveBeenCalledWith("pi_declined");
    const failed = (await t.run(ctx => ctx.db.query("billingCharges").collect()))[0];
    await Promise.all([admin.action(api.stripeActions.retryCharge, { chargeId: failed._id }), admin.action(api.stripeActions.retryCharge, { chargeId: failed._id })]);
    expect(stripe.create).toHaveBeenCalledTimes(2);
    expect((await admin.action(api.stripeActions.retryCharge, { chargeId: failed._id })).success).toBe(true);
    expect(stripe.create).toHaveBeenCalledTimes(2);
  });

  it("never automatically retries legacy failures with an unknown outcome", async () => {
    const { t, admin, profileId, studentId } = await setup();
    const chargeId = await t.run(ctx => ctx.db.insert("billingCharges", { studentId, billingProfileId: profileId, amountCents: 3000, status: "failed", weekStartDate: "2026-10-26", createdAt: Date.now() }));
    await expect(admin.action(api.stripeActions.retryCharge, { chargeId })).rejects.toThrow(/legacy/);
    expect(stripe.create).not.toHaveBeenCalled();
  });

  it("ignores duplicate and stale settlement events after success", async () => {
    const { t, admin, input } = await setup();
    const result = await admin.action(api.stripeActions.manualCharge, input);
    await t.mutation(internal.billingOperations.finish, { operationId: result.operationId!, status: "failed", error: "Stale event" });
    expect((await t.query(internal.billingOperations.get, { operationId: result.operationId! }))?.status).toBe("succeeded");
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(1);
  });
  it("accepts signed webhook recovery, ignores duplicate events, and rejects forged signatures", async () => {
    const { t, admin, input } = await setup();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture");
    stripe.create.mockRejectedValueOnce(new Error("response lost"));
    const result = await admin.action(api.stripeActions.manualCharge, input);
    const intent = { id: "pi_webhook", amount: 3000, currency: "aud", customer: "cus_test", metadata: { billingOperationId: result.operationId }, status: "succeeded" };
    stripe.retrieve.mockResolvedValue(intent);
    const payload = JSON.stringify({ id: "evt_fixture", type: "payment_intent.succeeded", data: { object: intent } });
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = createHmac("sha256", "whsec_fixture").update(`${timestamp}.${payload}`).digest("hex");
    const signature = `t=${timestamp},v1=${digest}`;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect((await t.action(internal.courseWebhook.handleStripeEvent, { payload, signature: "invalid" })).ok).toBe(false);
    } finally { log.mockRestore(); }
    expect(stripe.retrieve).not.toHaveBeenCalled();
    expect((await t.action(internal.courseWebhook.handleStripeEvent, { payload, signature })).ok).toBe(true);
    await t.action(internal.courseWebhook.handleStripeEvent, { payload, signature });
    expect(stripe.retrieve).toHaveBeenCalledTimes(1);
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(1);
    expect((await t.query(internal.billingOperations.get, { operationId: result.operationId! }))?.status).toBe("succeeded");
  });

  it("can reconcile an expired unknown payment with a verified Stripe reference", async () => {
    const { admin, input } = await setup();
    stripe.create.mockRejectedValueOnce(new Error("response lost"));
    const first = await admin.action(api.stripeActions.manualCharge, input);
    vi.setSystemTime(Date.now() + 25 * 60 * 60_000);
    stripe.retrieve.mockResolvedValue({ id: "pi_recovered", amount: 3000, currency: "aud", customer: "cus_test", metadata: { billingOperationId: first.operationId }, status: "succeeded" });
    expect((await admin.action(api.stripeActions.checkCharge, { operationId: first.operationId!, paymentIntentId: "pi_recovered" })).success).toBe(true);
    expect(stripe.create).toHaveBeenCalledTimes(1);
  });

  it("refuses mismatched payment references before cancelling or settling them", async () => {
    const { t, admin, input } = await setup();
    stripe.create.mockImplementationOnce(async args => ({ ...args, id: "pi_wrong", customer: "cus_someone_else", status: "requires_action" }));
    await expect(admin.action(api.stripeActions.manualCharge, input)).rejects.toThrow(/does not match/);
    expect(stripe.cancel).not.toHaveBeenCalled();
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(0);
  });

  it("retains reserved credit when cancellation cannot confirm a failure", async () => {
    const fixture = await setup();
    const { t, admin, adminId, studentId } = fixture;
    await admin.mutation(api.billing.addCredit, { adminId, studentId, amountCents: 1000, description: "Credit" });
    const operationId = await queueReviewedDay(fixture);
    stripe.create.mockImplementationOnce(async args => ({ ...args, id: "pi_unresolved", status: "requires_action" }));
    stripe.cancel.mockRejectedValueOnce(new Error("timeout"));
    expect((await t.action(internal.stripeActions.processBillingOperation, { operationId: operationId! })).status).toBe("uncertain");
    expect(await admin.query(api.billing.getStudentCreditBalance, { studentId })).toBe(0);
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(0);
  });

  it("never resumes a terminal failed obligation through an older retry button", async () => {
    const { t, admin, input } = await setup();
    stripe.create.mockRejectedValueOnce({ type: "StripeCardError", message: "Declined" });
    await admin.action(api.stripeActions.manualCharge, input);
    const failed = (await t.run(ctx => ctx.db.query("billingCharges").collect()))[0];
    const retry = await admin.action(api.stripeActions.retryCharge, { chargeId: failed._id });
    expect(retry.success).toBe(true);
    expect((await admin.action(api.stripeActions.retryCharge, { chargeId: failed._id })).operationId).toBe(retry.operationId);
    expect(stripe.create).toHaveBeenCalledTimes(2);
  });

});
