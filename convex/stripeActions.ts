"use node";

import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import type { ActionCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { sendDiscordNotification } from "./discord";
import { adelaideDate, adelaideWeekday } from "../lib/adelaideDate";
import { requireAdminClaims, requireStudentSelfOrAdminClaims } from "./identity";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function formatStripeError(err: any): string {
  if (!err) return "Unknown error";

  const declineCode: string | undefined =
    err.raw?.decline_code ?? err.decline_code;
  const code: string | undefined = err.code;

  const declineMessages: Record<string, string> = {
    insufficient_funds: "Insufficient funds on card",
    card_declined: "Card was declined by the bank",
    expired_card: "Card has expired",
    incorrect_cvc: "Incorrect CVC / security code",
    incorrect_number: "Incorrect card number",
    processing_error: "Processing error — try again",
    lost_card: "Card reported lost",
    stolen_card: "Card reported stolen",
    generic_decline: "Card declined — contact bank",
    do_not_honor: "Card declined — bank says do not honor",
    try_again_later: "Temporary issue — try again later",
    not_permitted: "Transaction not permitted on this card",
    withdrawal_count_limit_exceeded: "Card withdrawal limit exceeded",
    card_velocity_exceeded: "Too many transactions — try later",
    currency_not_supported: "Card does not support AUD currency",
    authentication_required: "Card requires 3D Secure authentication",
  };

  if (declineCode && declineMessages[declineCode]) {
    return declineMessages[declineCode];
  }

  const codeMessages: Record<string, string> = {
    card_declined: "Card was declined",
    expired_card: "Card has expired",
    incorrect_cvc: "Incorrect CVC / security code",
    incorrect_number: "Incorrect card number",
    payment_method_not_available: "Payment method no longer available",
    balance_insufficient: "Insufficient balance",
  };

  if (code && codeMessages[code]) {
    return codeMessages[code];
  }

  return err.message ?? "Unknown error";
}

export const createSetupIntent = action({
  args: { studentId: v.id("students") },
  returns: v.object({
    clientSecret: v.string(),
    stripeCustomerId: v.string(),
  }),
  handler: async (ctx, { studentId }): Promise<{ clientSecret: string; stripeCustomerId: string }> => {
    await requireStudentSelfOrAdminClaims(ctx, studentId);
    const stripe = getStripe();

    type ProfileResult = {
      _id: Id<"billingProfiles">;
      stripeCustomerId?: string;
      stripePaymentMethodId?: string;
      paymentType: string;
    } | null;

    const profile: ProfileResult = await ctx.runQuery(
      internal.billing.getBillingProfileInternal,
      { studentId },
    );
    if (!profile) {
      throw new Error("No billing profile found for this student");
    }

    let stripeCustomerId: string | undefined = profile.stripeCustomerId;

    if (!stripeCustomerId) {
      const student: { name: string; email?: string } | null = await ctx.runQuery(
        internal.billing.getStudentInternal,
        { studentId },
      );
      const customer: Stripe.Customer = await stripe.customers.create({
        name: student?.name ?? "Student",
        metadata: { studentId, billingProfileId: profile._id },
      });
      stripeCustomerId = customer.id;

      await ctx.runMutation(internal.billing.updateBillingProfileStripeCustomer, {
        billingProfileId: profile._id,
        stripeCustomerId,
      });
    }

    const setupIntent: Stripe.SetupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
    });

    if (!setupIntent.client_secret) {
      throw new Error("Failed to create SetupIntent");
    }

    return {
      clientSecret: setupIntent.client_secret,
      stripeCustomerId,
    };
  },
});

export const savePaymentMethod = action({
  args: {
    studentId: v.id("students"),
    stripePaymentMethodId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { studentId, stripePaymentMethodId }) => {
    await requireStudentSelfOrAdminClaims(ctx, studentId);
    const stripe = getStripe();

    const pm: Stripe.PaymentMethod = await stripe.paymentMethods.retrieve(
      stripePaymentMethodId,
    );
    const profile = await ctx.runQuery(internal.billing.getBillingProfileInternal, { studentId });
    const customerId = typeof pm.customer === "string" ? pm.customer : pm.customer?.id;
    if (!profile?.stripeCustomerId || customerId !== profile.stripeCustomerId || pm.type !== "card") {
      throw new ConvexError("This payment method does not belong to the student's billing account.");
    }
    const cardLast4 = pm.card?.last4 ?? undefined;
    const cardBrand = pm.card?.brand ?? undefined;

    await ctx.runMutation(internal.billing.updateBillingProfilePaymentMethod, {
      studentId,
      stripePaymentMethodId,
      cardLast4,
      cardBrand,
    });

    const student: { name: string } | null = await ctx.runQuery(
      internal.billing.getStudentInternal,
      { studentId },
    );
    const brandLabel = cardBrand ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1) : "Card";
    await sendDiscordNotification(
      "Payment Method Added",
      `**Student:** ${student?.name ?? "Unknown"}\n**Card:** ${brandLabel} ending in ${cardLast4 ?? "****"}`,
      0x8b5cf6,
    );

    return null;
  },
});

type BillingResult = { success: boolean; error?: string; operationId?: Id<"billingOperations">; status?: string };

async function operationResult(ctx: ActionCtx, operationId: Id<"billingOperations">): Promise<BillingResult> {
  const op = await ctx.runQuery(internal.billingOperations.get, { operationId });
  return { operationId, success: op?.status === "succeeded", status: op?.status,
    error: op?.status === "succeeded" ? undefined : op?.error ?? "Payment is still being checked. Use Check status rather than creating another charge." };
}

const billingResult = v.object({ success: v.boolean(), error: v.optional(v.string()), operationId: v.optional(v.id("billingOperations")), status: v.optional(v.string()) });

export const manualCharge = action({
  args: { adminId: v.id("tutorAccounts"), studentId: v.id("students"), amountCents: v.number(), description: v.string(), requestId: v.string() },
  returns: billingResult,
  handler: async (ctx, { adminId: _adminId, ...args }): Promise<BillingResult> => {
    await requireAdminClaims(ctx);
    if (!Number.isSafeInteger(args.amountCents) || args.amountCents <= 0) return { success: false, error: "Amount must be positive whole cents." };
    const operationId: Id<"billingOperations"> = await ctx.runMutation(internal.billingOperations.prepareManual, args);
    return await ctx.runAction(internal.stripeActions.processBillingOperation, { operationId });
  },
});

export const retryCharge = action({
  args: { chargeId: v.id("billingCharges") },
  returns: billingResult,
  handler: async (ctx, args): Promise<BillingResult> => {
    await requireAdminClaims(ctx);
    const operationId: Id<"billingOperations"> = await ctx.runMutation(internal.billingOperations.prepareRetry, args);
    return await ctx.runAction(internal.stripeActions.processBillingOperation, { operationId });
  },
});

export const checkCharge = action({
  args: { operationId: v.id("billingOperations"), paymentIntentId: v.optional(v.string()) },
  returns: billingResult,
  handler: async (ctx, { operationId, paymentIntentId }): Promise<BillingResult> => {
    await requireAdminClaims(ctx);
    if (paymentIntentId) {
      if (!/^pi_[a-zA-Z0-9_]+$/.test(paymentIntentId)) throw new Error("Enter a valid Stripe PaymentIntent ID.");
      await ctx.runAction(internal.stripeActions.reconcileBillingIntent, { operationId, paymentIntentId });
      return await operationResult(ctx, operationId);
    }
    return await ctx.runAction(internal.stripeActions.processBillingOperation, { operationId });
  },
});

function validateIntent(op: Doc<"billingOperations">, intent: Stripe.PaymentIntent) {
  const customer = typeof intent.customer === "string" ? intent.customer : intent.customer?.id;
  if (intent.amount !== op.chargeCents || intent.currency !== "aud" || customer !== op.stripeCustomerId || intent.metadata.billingOperationId !== op._id) {
    throw new Error("Payment intent does not match its billing operation.");
  }
}

async function settleIntent(ctx: ActionCtx, op: Doc<"billingOperations">, intent: Stripe.PaymentIntent): Promise<void> {
  validateIntent(op, intent);
  await ctx.runMutation(internal.billingOperations.finish, {
    operationId: op._id, paymentIntentId: intent.id,
    status: intent.status === "succeeded" ? "succeeded" : intent.status === "canceled" ? "failed" : "uncertain",
    error: intent.status === "succeeded" ? undefined : intent.status === "canceled" ? "Payment was cancelled or declined. A confirmed failed charge can be retried." : `Payment is ${intent.status}. Check its status before taking further action.`,
  });
}

export const processBillingOperation = internalAction({
  args: { operationId: v.id("billingOperations") },
  returns: billingResult,
  handler: async (ctx, { operationId }): Promise<BillingResult> => {
    const op: Doc<"billingOperations"> | null = await ctx.runMutation(internal.billingOperations.claim, { operationId });
    if (!op) return await operationResult(ctx, operationId);
    if (op.chargeCents === 0 || op.paymentType === "cash") {
      await ctx.runMutation(internal.billingOperations.finish, { operationId, status: "succeeded" });
      return await operationResult(ctx, operationId);
    }
    if (!op.stripeCustomerId || !op.stripePaymentMethodId) {
      await ctx.runMutation(internal.billingOperations.finish, { operationId, status: "failed", error: "No payment method on file." });
      return await operationResult(ctx, operationId);
    }
    // Stripe may discard keys after 24 hours. Never create again beyond a conservative 23-hour window.
    if (!op.stripePaymentIntentId && Date.now() - op.firstAttemptAt! >= 23 * 60 * 60_000) {
      await ctx.runMutation(internal.billingOperations.finish, { operationId, status: "uncertain", error: "Automatic recovery window expired. Reconcile this operation in Stripe; do not create another charge." });
      return await operationResult(ctx, operationId);
    }

    const stripe = getStripe();
    let intent: Stripe.PaymentIntent | undefined;
    let providerError: unknown;
    try {
      intent = op.stripePaymentIntentId
        ? await stripe.paymentIntents.retrieve(op.stripePaymentIntentId)
        : await stripe.paymentIntents.create({
          amount: op.chargeCents, currency: "aud", customer: op.stripeCustomerId,
          payment_method: op.stripePaymentMethodId, off_session: true, confirm: true,
          receipt_email: op.receiptEmail, description: `Simple Tuition — ${op.description}`,
          metadata: { billingOperationId: op._id, studentId: op.studentId, billingProfileId: op.billingProfileId, chargeDate: op.chargeDate },
        }, { idempotencyKey: `billing:${operationId}` });
    } catch (error) {
      providerError = error;
      // A decline can still carry an existing PaymentIntent. Retrieve its current state.
      const embedded = (error as { payment_intent?: string | { id: string }; raw?: { payment_intent?: string | { id: string } } }).payment_intent
        ?? (error as { raw?: { payment_intent?: string | { id: string } } }).raw?.payment_intent;
      const id = typeof embedded === "string" ? embedded : embedded?.id;
      if (id) {
        try { intent = await stripe.paymentIntents.retrieve(id); }
        catch {
          await ctx.runMutation(internal.billingOperations.finish, { operationId, status: "uncertain", paymentIntentId: id, error: "Stripe returned a payment reference but its result could not be confirmed." });
          return await operationResult(ctx, operationId);
        }
      }
    }
    if (!intent) {
      const definiteDecline = (providerError as { type?: string })?.type === "StripeCardError";
      await ctx.runMutation(internal.billingOperations.finish, {
        operationId, status: definiteDecline ? "failed" : "uncertain",
        error: definiteDecline ? formatStripeError(providerError) : "Payment outcome is not confirmed. Check status; do not create a new charge.",
      });
      return await operationResult(ctx, operationId);
    }
    validateIntent(op, intent);
    // Cancel unconfirmed declined/authentication-required intents before releasing credit or permitting a new attempt.
    if (["requires_payment_method", "requires_action", "requires_confirmation"].includes(intent.status)) {
      try { intent = await stripe.paymentIntents.cancel(intent.id); }
      catch {
        await ctx.runMutation(internal.billingOperations.finish, { operationId, status: "uncertain", paymentIntentId: intent.id, error: "The incomplete payment could not be cancelled. Check status before retrying." });
        return await operationResult(ctx, operationId);
      }
    }
    // Deliberately outside the provider catch: a database failure must never become a failed payment.
    await settleIntent(ctx, op, intent);
    return await operationResult(ctx, operationId);
  },
});

// Called only after Stripe webhook signature verification. Retrieval handles out-of-order events.
export const reconcileBillingIntent = internalAction({
  args: { paymentIntentId: v.string(), operationId: v.id("billingOperations") },
  handler: async (ctx, { paymentIntentId, operationId }): Promise<void> => {
    const op: Doc<"billingOperations"> | null = await ctx.runQuery(internal.billingOperations.get, { operationId });
    if (!op || ["succeeded", "failed"].includes(op.status)) return;
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    await settleIntent(ctx, op, intent);
  },
});

export const chargeAllActive = internalAction({
  args: { cursor: v.optional(v.union(v.string(), v.null())), chargeDate: v.optional(v.string()), dayOfWeek: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const now = new Date();
    const chargeDate = args.chargeDate ?? adelaideDate(now);
    const dayOfWeek = args.dayOfWeek ?? adelaideWeekday(now);
    const batch = await ctx.runQuery(internal.billingOperations.profileBatch, { cursor: args.cursor ?? null });
    for (const profile of batch.page) {
      const operationId: Id<"billingOperations"> | null = await ctx.runMutation(internal.billingOperations.prepareDaily, { billingProfileId: profile._id, chargeDate, dayOfWeek });
      if (operationId) {
        // Preparation already schedules recovery, so one provider outage cannot stop the batch.
        try { await ctx.runAction(internal.stripeActions.processBillingOperation, { operationId }); }
        catch { console.error("Billing operation requires recovery", { operationId }); }
      }
    }
    if (!batch.isDone) await ctx.scheduler.runAfter(0, internal.stripeActions.chargeAllActive, { cursor: batch.continueCursor, chargeDate, dayOfWeek });
    return null;
  },
});
