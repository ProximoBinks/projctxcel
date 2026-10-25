import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAdmin } from "./identity";
import { requiredText, validCents } from "./adminValidation";
import { getCreditBalanceHelper } from "./billing";
import { recordRevenue } from "./billingRevenue";
import { adelaideDate } from "../lib/adelaideDate";

export async function insertOperation(ctx: MutationCtx, values: Omit<Doc<"billingOperations">, "_id" | "_creationTime" | "status" | "attempts" | "leaseUntil" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const id = await ctx.db.insert("billingOperations", { ...values, status: "pending", attempts: 0, leaseUntil: 0, createdAt: now, updatedAt: now });
  // Recovery is committed with the intent, before an action can contact Stripe.
  await ctx.scheduler.runAfter(65_000, internal.stripeActions.processBillingOperation, { operationId: id });
  return id;
}

async function profileFor(ctx: MutationCtx, studentId: Id<"students">) {
  const profile = await ctx.db.query("billingProfiles").withIndex("by_studentId", q => q.eq("studentId", studentId)).unique();
  if (!profile) throw new ConvexError("No billing profile found.");
  const student = await ctx.db.get(studentId);
  if (!student) throw new ConvexError("Student not found.");
  return { profile, receiptEmail: student.parentEmail || student.email || undefined };
}

export const prepareManual = internalMutation({
  args: { requestId: v.string(), studentId: v.id("students"), amountCents: v.number(), description: v.string() },
  handler: async (ctx, args): Promise<Id<"billingOperations">> => {
    const adminId = await requireAdmin(ctx);
    validCents(args.amountCents, true);
    const description = requiredText(args.description, "Charge description");
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(args.requestId)) throw new ConvexError("A valid payment request ID is required.");
    const key = `manual:${adminId}:${args.requestId}`;
    const existing = await ctx.db.query("billingOperations").withIndex("by_key", q => q.eq("key", key)).unique();
    if (existing) {
      if (existing.studentId !== args.studentId || existing.amountCents !== args.amountCents || existing.description !== description) {
        throw new ConvexError("This request ID already belongs to a different payment.");
      }
      return existing._id;
    }
    const { profile, receiptEmail } = await profileFor(ctx, args.studentId);
    if (profile.paymentType !== "card" || !profile.stripeCustomerId || !profile.stripePaymentMethodId) throw new ConvexError("No card on file for this student.");
    return await insertOperation(ctx, {
      key, source: "manual", studentId: args.studentId, billingProfileId: profile._id,
      amountCents: args.amountCents, creditCents: 0, chargeCents: args.amountCents,
      paymentType: "card", stripeCustomerId: profile.stripeCustomerId, stripePaymentMethodId: profile.stripePaymentMethodId,
      receiptEmail, description, chargeDate: adelaideDate(), createdBy: adminId,
    });
  },
});

// Compatibility endpoint for already queued legacy jobs. New daily payments must
// be created by the approved-review dispatcher, never by the old morning runner.
export const prepareDaily = internalMutation({
  args: { billingProfileId: v.id("billingProfiles"), chargeDate: v.string(), dayOfWeek: v.string() },
  handler: async (): Promise<Id<"billingOperations"> | null> => null,
});

export const prepareRetry = internalMutation({
  args: { chargeId: v.id("billingCharges") },
  handler: async (ctx, { chargeId }): Promise<Id<"billingOperations">> => {
    const adminId = await requireAdmin(ctx);
    const charge = await ctx.db.get(chargeId);
    if (!charge || charge.status !== "failed") throw new ConvexError("Only a confirmed failed charge can be retried.");
    if (charge.retryOperationId) return charge.retryOperationId;
    if (!charge.operationId) throw new ConvexError("Check this legacy charge in Stripe before creating a new charge. Its outcome cannot be safely retried automatically.");
    const original = await ctx.db.get(charge.operationId);
    if (!original || original.status !== "failed") throw new ConvexError("Check the original payment status before retrying.");
    const { profile, receiptEmail } = await profileFor(ctx, charge.studentId);
    if (profile.paymentType !== "card" || !profile.stripeCustomerId || !profile.stripePaymentMethodId) throw new ConvexError("No card on file.");
    // Re-reserve credit released by a failed daily attempt. Manual payments never use credit.
    const balance = original.creditCents > 0 ? await getCreditBalanceHelper(ctx, charge.studentId) : 0;
    const creditCents = Math.min(Math.max(0, balance), original.creditCents);
    const id = await insertOperation(ctx, {
      key: `retry:${chargeId}`, source: "retry", retryOf: chargeId, studentId: charge.studentId,
      billingProfileId: profile._id, amountCents: original.amountCents, creditCents,
      chargeCents: original.amountCents - creditCents, paymentType: "card",
      stripeCustomerId: profile.stripeCustomerId, stripePaymentMethodId: profile.stripePaymentMethodId,
      receiptEmail, description: original.description, chargeDate: original.chargeDate, createdBy: adminId,
    });
    await ctx.db.patch(chargeId, { retryOperationId: id });
    return id;
  },
});

export const get = internalQuery({
  args: { operationId: v.id("billingOperations") },
  handler: async (ctx, { operationId }) => ctx.db.get(operationId),
});

export const claim = internalMutation({
  args: { operationId: v.id("billingOperations") },
  handler: async (ctx, { operationId }): Promise<Doc<"billingOperations"> | null> => {
    const op = await ctx.db.get(operationId);
    const now = Date.now();
    if (!op || ["succeeded", "failed"].includes(op.status) || op.leaseUntil > now) return null;
    const patch = { leaseUntil: now + 60_000, attempts: op.attempts + 1, firstAttemptAt: op.firstAttemptAt ?? now, updatedAt: now };
    await ctx.db.patch(operationId, patch);
    if (op.attempts < 6) await ctx.scheduler.runAfter(5 * 60_000, internal.stripeActions.processBillingOperation, { operationId });
    return { ...op, ...patch };
  },
});

export const finish = internalMutation({
  args: { operationId: v.id("billingOperations"), status: v.union(v.literal("succeeded"), v.literal("failed"), v.literal("uncertain")), paymentIntentId: v.optional(v.string()), error: v.optional(v.string()) },
  handler: async (ctx, { operationId, status, paymentIntentId, error }): Promise<void> => {
    const op = await ctx.db.get(operationId);
    if (!op || ["succeeded", "failed"].includes(op.status)) return;
    if (op.stripePaymentIntentId && paymentIntentId && op.stripePaymentIntentId !== paymentIntentId) throw new ConvexError("Payment intent mismatch.");
    if (status === "uncertain") {
      await ctx.db.patch(operationId, { status, stripePaymentIntentId: paymentIntentId ?? op.stripePaymentIntentId, error, leaseUntil: 0, updatedAt: Date.now() });
      return;
    }
    const chargeId = await ctx.db.insert("billingCharges", {
      studentId: op.studentId, billingProfileId: op.billingProfileId, operationId,
      amountCents: op.amountCents, paidCents: status === "succeeded" ? op.chargeCents : 0,
      creditAppliedCents: status === "succeeded" ? op.creditCents : 0,
      status: status === "failed" ? "failed" : op.chargeCents === 0 ? "credit_applied" : op.paymentType === "cash" ? "cash" : "succeeded",
      weekStartDate: op.chargeDate, stripePaymentIntentId: paymentIntentId ?? op.stripePaymentIntentId,
      failureReason: status === "failed" ? error : undefined,
      description: `${op.source === "daily" ? "Auto" : op.source === "retry" ? "Retry" : "Manual"}: ${op.description}`, createdAt: Date.now(),
    });
    await recordRevenue(ctx, (await ctx.db.get(chargeId))!);
    if (status === "succeeded" && op.paymentType === "card" && op.chargeCents > 0) {
      await ctx.scheduler.runAfter(0, internal.discord.notify, { title: "Payment Successful", description: `Amount: $${(op.chargeCents / 100).toFixed(2)}\n${op.description}`, color: 0x10b981 });
    }
    if (status === "succeeded" && op.creditCents > 0) {
      await ctx.db.insert("billingCredits", { studentId: op.studentId, amountCents: -op.creditCents, reason: "applied_to_charge", description: op.description, billingChargeId: chargeId, createdAt: Date.now() });
    }
    await ctx.db.patch(operationId, { status, chargeId, stripePaymentIntentId: paymentIntentId ?? op.stripePaymentIntentId, error: status === "failed" ? error : undefined, leaseUntil: 0, updatedAt: Date.now() });
  },
});

export const profileBatch = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => ctx.db.query("billingProfiles").withIndex("by_status", q => q.eq("status", "active")).paginate({ numItems: 25, cursor }),
});
