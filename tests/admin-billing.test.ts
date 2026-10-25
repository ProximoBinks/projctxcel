import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

const stripe = vi.hoisted(() => ({ retrieve: vi.fn(), create: vi.fn() }));
vi.mock("stripe", () => ({ default: class {
  paymentMethods = { retrieve: stripe.retrieve };
  paymentIntents = { create: stripe.create };
} }));
vi.mock("../convex/discord", () => ({ sendDiscordNotification: vi.fn() }));
const modules = import.meta.glob("../convex/**/*.{ts,js}");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const adminId = await ctx.db.insert("tutorAccounts", { name: "Admin", email: "admin@example.com", passwordHash: "fixture", hourlyRate: 0, active: true, roles: ["admin"] });
    const studentId = await ctx.db.insert("students", { name: "Student", yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
    const profileId = await ctx.db.insert("billingProfiles", { studentId, paymentType: "card", status: "active", stripeCustomerId: "cus_expected", createdAt: Date.now() });
    return { adminId, studentId, profileId };
  });
  const admin = t.withIdentity({ subject: ids.adminId, type: "admin", tutorAccountId: ids.adminId, roles: ["admin"] });
  return { t, admin, ...ids };
}

describe("admin billing action safeguards (Stripe mocked)", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture"); });

  it("rejects deactivated admins before any payment provider call", async () => {
    const { t, admin, adminId, studentId } = await setup();
    await t.run(ctx => ctx.db.patch(adminId, { active: false }));
    await expect(admin.action(api.stripeActions.manualCharge, { adminId, studentId, amountCents: 100, description: "Test", requestId: "test-request-00000001" })).rejects.toThrow(/Forbidden/);
    await expect(admin.action(api.stripeActions.savePaymentMethod, { studentId, stripePaymentMethodId: "pm_test" })).rejects.toThrow(/Forbidden/);
    expect(stripe.create).not.toHaveBeenCalled();
    expect(stripe.retrieve).not.toHaveBeenCalled();
  });

  it("rejects a payment method attached to a different customer", async () => {
    const { t, admin, studentId, profileId } = await setup();
    stripe.retrieve.mockResolvedValue({ id: "pm_wrong", type: "card", customer: "cus_other", card: { last4: "4242", brand: "visa" } });
    await expect(admin.action(api.stripeActions.savePaymentMethod, { studentId, stripePaymentMethodId: "pm_wrong" })).rejects.toThrow(/does not belong/);
    expect((await t.run(ctx => ctx.db.get(profileId)))?.stripePaymentMethodId).toBeUndefined();
  });

  it("saves a verified customer's card", async () => {
    const { t, admin, studentId, profileId } = await setup();
    stripe.retrieve.mockResolvedValue({ id: "pm_expected", type: "card", customer: "cus_expected", card: { last4: "4242", brand: "visa" } });
    await admin.action(api.stripeActions.savePaymentMethod, { studentId, stripePaymentMethodId: "pm_expected" });
    expect(await t.run(ctx => ctx.db.get(profileId))).toMatchObject({ stripePaymentMethodId: "pm_expected", cardLast4: "4242" });
  });

  it.each([NaN, Infinity, -1, 0, 1.5])("rejects invalid charge amounts before Stripe: %s", async amountCents => {
    const { admin, adminId, studentId } = await setup();
    expect(await admin.action(api.stripeActions.manualCharge, { adminId, studentId, amountCents, description: "Test", requestId: "test-request-00000001" })).toMatchObject({ success: false });
    expect(stripe.create).not.toHaveBeenCalled();
  });
});
