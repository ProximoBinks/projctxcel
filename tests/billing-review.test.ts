import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { adelaideDate, adelaideTime, adelaideTimestamp } from "../lib/adelaideDate";

const stripe = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("stripe", () => ({ default: class { paymentIntents = stripe; } }));
vi.mock("../convex/discord", () => ({ sendDiscordNotification: vi.fn() }));
const modules = import.meta.glob("../convex/**/*.{ts,js}");
const date = "2026-10-26";
const at = (time: string) => vi.setSystemTime(adelaideTimestamp(date, time));
const pageArgs = { date, paginationOpts: { numItems: 50, cursor: null } };

async function setup(twoLessons = false) {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const adminId = await ctx.db.insert("tutorAccounts", { name: "Admin", email: "admin@example.com", passwordHash: "fixture", hourlyRate: 3000, active: true, roles: ["admin"] });
    const studentId = await ctx.db.insert("students", { name: "Student", yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
    const profileId = await ctx.db.insert("billingProfiles", { studentId, paymentType: "card", status: "active", stripeCustomerId: "cus_test", stripePaymentMethodId: "pm_test", createdAt: Date.now() });
    const classIds = [];
    for (let i = 0; i < (twoLessons ? 2 : 1); i++) {
      const classId = await ctx.db.insert("classes", { name: `Lesson ${i + 1}`, subject: "English", yearLevel: "Year 12", dayOfWeek: "Monday", startTime: "16:00", endTime: "17:00", hourlyRateCents: 3000, active: true, createdAt: Date.now() });
      await ctx.db.insert("classStudents", { classId, studentId, active: true, assignedAt: Date.now() });
      classIds.push(classId);
    }
    return { adminId, studentId, profileId, classIds };
  });
  const admin = t.withIdentity({ subject: ids.adminId, type: "admin", tutorAccountId: ids.adminId, roles: ["admin"] });
  const dayId = await admin.mutation(api.billingReview.prepareToday, {});
  await t.mutation(internal.billingReview.preparePage, { dayId });
  const rows = (await admin.query(api.billingReview.lessons, pageArgs)).page;
  const selections = rows.map(row => ({ id: row._id, version: row.version }));
  return { t, admin, dayId, rows, selections, ...ids };
}

describe("daily billing review", () => {
  beforeEach(() => {
    vi.useFakeTimers(); at("18:00"); vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture"); vi.resetAllMocks();
    stripe.create.mockImplementation(async args => ({ ...args, id: "pi_test", status: "succeeded" }));
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

  it.each([
    ["2026-06-01", "2026-06-01T09:30:00.000Z"],
    ["2026-10-26", "2026-10-26T08:30:00.000Z"],
    ["2026-10-04", "2026-10-04T08:30:00.000Z"],
    ["2026-04-05", "2026-04-05T09:30:00.000Z"],
  ])("keeps 7pm Adelaide time across daylight saving: %s", (date, utc) => {
    const timestamp = adelaideTimestamp(date);
    expect(new Date(timestamp).toISOString()).toBe(utc);
    expect(adelaideDate(new Date(timestamp))).toBe(date);
    expect(adelaideTime(new Date(timestamp))).toBe("19:00");
  });

  it("prepares the summary from 6pm, without contacting Stripe", async () => {
    const t = convexTest(schema, modules);
    at("17:59"); await t.mutation(internal.billingReview.tick, {});
    expect(await t.run(ctx => ctx.db.query("billingReviewDays").collect())).toHaveLength(0);
    at("18:00"); await t.mutation(internal.billingReview.tick, {});
    await t.mutation(internal.billingReview.tick, {});
    expect(await t.run(ctx => ctx.db.query("billingReviewDays").collect())).toHaveLength(1);
    expect(stripe.create).not.toHaveBeenCalled();
  });

  it("requires an active admin for the summary and every approval action", async () => {
    const { t, admin, adminId, rows, dayId, selections } = await setup();
    await expect(t.query(api.billingReview.day, { date })).rejects.toThrow(/Unauthenticated/);
    await expect(t.query(api.billingReview.lessons, pageArgs)).rejects.toThrow(/Unauthenticated/);
    await expect(t.mutation(api.billingReview.prepareToday, {})).rejects.toThrow(/Unauthenticated/);
    await expect(t.mutation(api.billingReview.approve, { reviews: selections })).rejects.toThrow(/Unauthenticated/);
    await expect(t.mutation(api.billingReview.edit, { reviewId: rows[0]._id, version: 1, amountCents: 3000, note: "", hold: true })).rejects.toThrow(/Unauthenticated/);
    await expect(t.mutation(api.billingReview.chargeApprovedNow, { dayId, reviews: selections })).rejects.toThrow(/Unauthenticated/);
    await t.run(ctx => ctx.db.patch(adminId, { active: false }));
    await expect(admin.mutation(api.billingReview.approve, { reviews: selections })).rejects.toThrow(/Forbidden/);
  });

  it("never charges unapproved lessons or resumes the old morning runner", async () => {
    const { t, dayId, profileId } = await setup();
    at("19:00");
    await t.mutation(internal.billingReview.dispatchPage, { dayId });
    expect(await t.mutation(internal.billingOperations.prepareDaily, { billingProfileId: profileId, chargeDate: date, dayOfWeek: "Monday" })).toBeNull();
    await t.action(internal.stripeActions.chargeAllActive, {});
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(0);
    expect(stripe.create).not.toHaveBeenCalled();
  });

  it("groups approved lessons per student at 7pm, reserves credit, and deduplicates concurrent runs", async () => {
    const { t, admin, adminId, studentId, dayId, selections } = await setup(true);
    await admin.mutation(api.billing.addCredit, { adminId, studentId, amountCents: 5000, description: "Credit" });
    await admin.mutation(api.billingReview.approve, { reviews: selections });
    expect(await admin.query(api.billing.getStudentCreditBalance, { studentId })).toBe(5000);
    await t.mutation(internal.billingReview.dispatchPage, { dayId });
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(0);
    at("19:00");
    await Promise.all([t.mutation(internal.billingReview.dispatchPage, { dayId }), t.mutation(internal.billingReview.dispatchPage, { dayId })]);
    const ops = await t.run(ctx => ctx.db.query("billingOperations").collect());
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ amountCents: 6000, creditCents: 5000, chargeCents: 1000 });
    expect(ops[0].reviewIds).toHaveLength(2);
    await t.action(internal.stripeActions.processBillingOperation, { operationId: ops[0]._id });
    await t.action(internal.stripeActions.processBillingOperation, { operationId: ops[0]._id });
    expect(stripe.create).toHaveBeenCalledTimes(1);
    expect(stripe.create.mock.calls[0][0].amount).toBe(1000);
    expect((await admin.query(api.billingReview.day, { date })).summary).toMatchObject({ pendingCount: 0, approvedCount: 0, submittedCount: 2, approvedCents: 0 });
    expect(await t.run(ctx => ctx.db.query("billingCharges").collect())).toHaveLength(1);
  });

  it("keeps late approval on hold until an explicit charge action", async () => {
    const { t, admin, dayId, selections } = await setup();
    at("19:01");
    await admin.mutation(api.billingReview.approve, { reviews: selections });
    await t.mutation(internal.billingReview.dispatchPage, { dayId });
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(0);
    const approved = (await admin.query(api.billingReview.lessons, pageArgs)).page;
    expect(approved[0].autoChargeEligible).toBe(false);
    const reviews = approved.map(row => ({ id: row._id, version: row.version }));
    await admin.mutation(api.billingReview.chargeApprovedNow, { dayId, reviews });
    await admin.mutation(api.billingReview.chargeApprovedNow, { dayId, reviews });
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(1);
  });

  it("cannot approve unfinished lessons or use charge-now before 7pm", async () => {
    const { admin, dayId, selections } = await setup();
    at("16:59"); await expect(admin.mutation(api.billingReview.approve, { reviews: selections })).rejects.toThrow(/finished/);
    at("18:00"); await admin.mutation(api.billingReview.approve, { reviews: selections });
    const rows = (await admin.query(api.billingReview.lessons, pageArgs)).page;
    await expect(admin.mutation(api.billingReview.chargeApprovedNow, { dayId, reviews: rows.map(row => ({ id: row._id, version: row.version })) })).rejects.toThrow(/7pm/);
  });

  it("edits invalidate approval and stale screens cannot approve changed amounts", async () => {
    const { t, admin, rows, selections, dayId } = await setup();
    await admin.mutation(api.billingReview.approve, { reviews: selections });
    await admin.mutation(api.billingReview.edit, { reviewId: rows[0]._id, version: 2, amountCents: 2500, note: "Shortened lesson", hold: false });
    await expect(admin.mutation(api.billingReview.approve, { reviews: selections })).rejects.toThrow(/changed/);
    expect((await admin.query(api.billingReview.day, { date })).summary).toMatchObject({ pendingCount: 1, approvedCount: 0, approvedCents: 0, totalCents: 2500 });
    at("19:00"); await t.mutation(internal.billingReview.dispatchPage, { dayId });
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(0);
  });

  it("requires an adjustment reason and keeps cancelled lessons held across refresh", async () => {
    const { t, admin, rows, dayId } = await setup();
    await expect(admin.mutation(api.billingReview.edit, { reviewId: rows[0]._id, version: 1, amountCents: 2500, note: "", hold: false })).rejects.toThrow(/reason/);
    await admin.mutation(api.billingReview.edit, { reviewId: rows[0]._id, version: 1, amountCents: 3000, note: "Cancelled", hold: true });
    await admin.mutation(api.billingReview.prepareToday, {});
    await t.mutation(internal.billingReview.preparePage, { dayId });
    expect((await admin.query(api.billingReview.lessons, pageArgs)).page[0].status).toBe("held");
    expect((await admin.query(api.billingReview.day, { date })).summary).toMatchObject({ lessonCount: 1, heldCount: 1, pendingCount: 0 });
  });

  it.each(["rate", "pause", "admin", "paymentType"])("rechecks %s changes before automatic payment", async change => {
    const { t, admin, adminId, profileId, classIds, dayId, selections } = await setup();
    await admin.mutation(api.billingReview.approve, { reviews: selections });
    await t.run(async ctx => {
      if (change === "rate") await ctx.db.patch(classIds[0], { hourlyRateCents: 4000 });
      if (change === "pause") await ctx.db.patch(profileId, { status: "paused" });
      if (change === "admin") await ctx.db.patch(adminId, { active: false });
      if (change === "paymentType") await ctx.db.patch(profileId, { paymentType: "cash" });
    });
    at("19:00"); await t.mutation(internal.billingReview.dispatchPage, { dayId });
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(0);
    expect((await t.run(ctx => ctx.db.query("billingReviews").first()))?.status).toBe("held");
  });

  it("refreshes changed prices and clears approval before showing the new amount", async () => {
    const { t, admin, selections, dayId, classIds } = await setup();
    await admin.mutation(api.billingReview.approve, { reviews: selections });
    await t.run(ctx => ctx.db.patch(classIds[0], { hourlyRateCents: 4500 }));
    await admin.mutation(api.billingReview.prepareToday, {});
    await t.mutation(internal.billingReview.preparePage, { dayId });
    const row = (await admin.query(api.billingReview.lessons, pageArgs)).page[0];
    expect(row).toMatchObject({ status: "pending", amountCents: 4500, autoChargeEligible: false });
    expect(row.approvedBy).toBeUndefined();
  });

  it("does not rebill a day already handled by legacy billing", async () => {
    const { t, admin, studentId, profileId, selections } = await setup();
    await t.run(ctx => ctx.db.insert("billingCharges", { studentId, billingProfileId: profileId, amountCents: 3000, status: "succeeded", weekStartDate: date, createdAt: Date.now() }));
    await expect(admin.mutation(api.billingReview.approve, { reviews: selections })).rejects.toThrow(/previous billing/);
    expect(stripe.create).not.toHaveBeenCalled();
  });

  it("charges only explicitly selected late approvals, even for the same student", async () => {
    const { t, admin, dayId, selections } = await setup(true);
    at("19:01"); await admin.mutation(api.billingReview.approve, { reviews: selections });
    const rows = (await admin.query(api.billingReview.lessons, pageArgs)).page;
    await admin.mutation(api.billingReview.chargeApprovedNow, { dayId, reviews: [{ id: rows[0]._id, version: rows[0].version }] });
    const ops = await t.run(ctx => ctx.db.query("billingOperations").collect());
    expect(ops).toHaveLength(1); expect(ops[0].amountCents).toBe(3000);
    expect((await admin.query(api.billingReview.lessons, pageArgs)).page.filter(row => row.status === "approved")).toHaveLength(1);
  });

  it("records approved cash lessons without calling Stripe", async () => {
    const { t, admin, profileId, dayId, selections } = await setup();
    await t.run(ctx => ctx.db.patch(profileId, { paymentType: "cash" }));
    await admin.mutation(api.billingReview.approve, { reviews: selections });
    at("19:00"); await t.mutation(internal.billingReview.dispatchPage, { dayId });
    const op = (await t.run(ctx => ctx.db.query("billingOperations").first()))!;
    await t.action(internal.stripeActions.processBillingOperation, { operationId: op._id });
    expect(stripe.create).not.toHaveBeenCalled();
    expect((await t.run(ctx => ctx.db.query("billingCharges").first()))?.status).toBe("cash");
  });

  it("prepares multiple pages without duplicating lessons on repeated jobs", async () => {
    const { t, admin, dayId, classIds } = await setup();
    await t.run(async ctx => {
      for (let i = 0; i < 30; i++) {
        const studentId = await ctx.db.insert("students", { name: `Student ${i}`, yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
        await ctx.db.insert("billingProfiles", { studentId, status: "active", paymentType: "cash", createdAt: Date.now() });
        await ctx.db.insert("classStudents", { studentId, classId: classIds[0], active: true, assignedAt: Date.now() });
      }
    });
    await admin.mutation(api.billingReview.prepareToday, {});
    await t.mutation(internal.billingReview.preparePage, { dayId });
    expect((await admin.query(api.billingReview.day, { date })).summary?.status).toBe("preparing");
    await t.mutation(internal.billingReview.preparePage, { dayId });
    await t.mutation(internal.billingReview.preparePage, { dayId });
    expect((await admin.query(api.billingReview.day, { date })).summary).toMatchObject({ status: "ready", lessonCount: 31, pendingCount: 31 });
    expect((await admin.query(api.billingReview.lessons, pageArgs)).page).toHaveLength(31);
  });
  it("shows a successful retry in the daily review without creating another lesson charge", async () => {
    const { t, admin, dayId, selections } = await setup();
    await admin.mutation(api.billingReview.approve, { reviews: selections });
    at("19:00"); await t.mutation(internal.billingReview.dispatchPage, { dayId });
    const op = (await t.run(ctx => ctx.db.query("billingOperations").first()))!;
    stripe.create.mockRejectedValueOnce({ type: "StripeCardError", message: "Declined" });
    await t.action(internal.stripeActions.processBillingOperation, { operationId: op._id });
    const charge = (await t.run(ctx => ctx.db.query("billingCharges").first()))!;
    expect((await admin.action(api.stripeActions.retryCharge, { chargeId: charge._id })).success).toBe(true);
    const row = (await admin.query(api.billingReview.lessons, pageArgs)).page[0];
    expect(row).toMatchObject({ status: "submitted", operationStatus: "succeeded", paidCents: 3000 });
    expect(stripe.create).toHaveBeenCalledTimes(2);
  });

});
