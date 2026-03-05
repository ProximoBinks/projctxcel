"use node";

import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
    const stripe = getStripe();

    const pm: Stripe.PaymentMethod = await stripe.paymentMethods.retrieve(
      stripePaymentMethodId,
    );
    const cardLast4 = pm.card?.last4 ?? undefined;
    const cardBrand = pm.card?.brand ?? undefined;

    await ctx.runMutation(internal.billing.updateBillingProfilePaymentMethod, {
      studentId,
      stripePaymentMethodId,
      cardLast4,
      cardBrand,
    });
    return null;
  },
});

export const manualCharge = action({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    amountCents: v.number(),
    description: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { adminId, studentId, amountCents, description }): Promise<{ success: boolean; error?: string }> => {
    // Verify admin
    const admin: { roles?: string[] } | null = await ctx.runQuery(
      internal.billing.getAdminInternal,
      { adminId },
    );
    if (!admin || !admin.roles?.includes("admin")) {
      return { success: false, error: "Unauthorized" };
    }

    if (amountCents <= 0) {
      return { success: false, error: "Amount must be greater than zero" };
    }

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
      return { success: false, error: "No billing profile found" };
    }
    if (profile.paymentType !== "card") {
      return { success: false, error: "Student is on cash billing — cannot charge a card" };
    }
    if (!profile.stripeCustomerId || !profile.stripePaymentMethodId) {
      return { success: false, error: "No card on file for this student" };
    }

    const stripe = getStripe();
    const chargeDate = new Date().toISOString().split("T")[0];

    const student: { name: string; email?: string; parentEmail?: string } | null =
      await ctx.runQuery(internal.billing.getStudentInternal, { studentId });
    const receiptEmail = student?.parentEmail || student?.email || undefined;

    try {
      const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "aud",
        customer: profile.stripeCustomerId,
        payment_method: profile.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        receipt_email: receiptEmail,
        description: `Simple Tuition — ${description}`,
        metadata: {
          studentId,
          billingProfileId: profile._id,
          chargeDate,
          type: "manual",
          description,
        },
      });

      const succeeded = paymentIntent.status === "succeeded";
      const failMsg = succeeded
        ? undefined
        : `Payment ${paymentIntent.status}`;

      await ctx.runMutation(internal.billing.recordCharge, {
        studentId,
        billingProfileId: profile._id,
        amountCents,
        status: succeeded ? "succeeded" : "failed",
        weekStartDate: chargeDate,
        stripePaymentIntentId: paymentIntent.id,
        failureReason: failMsg,
        description: `Manual: ${description}`,
      });

      return succeeded
        ? { success: true }
        : { success: false, error: failMsg };
    } catch (err: any) {
      const friendlyError = formatStripeError(err);
      await ctx.runMutation(internal.billing.recordCharge, {
        studentId,
        billingProfileId: profile._id,
        amountCents,
        status: "failed",
        weekStartDate: chargeDate,
        failureReason: friendlyError,
        description: `Manual: ${description}`,
      });
      return { success: false, error: friendlyError };
    }
  },
});

export const chargeAllActive = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const stripe = getStripe();

    type BillingProfile = {
      _id: Id<"billingProfiles">;
      studentId: Id<"students">;
      paymentType: string;
      stripeCustomerId?: string;
      stripePaymentMethodId?: string;
    };

    const profiles: BillingProfile[] = await ctx.runQuery(
      internal.billing.listActiveBillingProfiles,
    );

    // Adelaide is UTC+9:30 (ACST). Compute today's date & day-name there.
    const now = new Date();
    const adelaideMs = now.getTime() + 9.5 * 60 * 60 * 1000;
    const adelaideDate = new Date(adelaideMs);
    const chargeDate: string = adelaideDate.toISOString().split("T")[0];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek: string = dayNames[adelaideDate.getDay()];

    for (const profile of profiles) {
      const rate: {
        totalCents: number;
        breakdown: Array<{
          className: string;
          tutorName: string;
          subject: string;
          paused: boolean;
          lineTotalCents: number;
        }>;
      } = await ctx.runQuery(
        internal.billing.calculateDailyRate,
        { studentId: profile.studentId, dayOfWeek, referenceDate: chargeDate },
      );

      const classDetails = rate.breakdown
        .filter((l) => !l.paused && l.lineTotalCents > 0)
        .map((l) => `${l.subject} — ${l.tutorName}`)
        .join(", ");

      if (rate.totalCents <= 0) continue;

      const creditBalance: number = await ctx.runQuery(
        internal.billing.getCreditBalanceInternal,
        { studentId: profile.studentId },
      );

      let amountToCharge: number = rate.totalCents;
      let creditUsed: number = 0;

      if (creditBalance > 0) {
        creditUsed = Math.min(creditBalance, amountToCharge);
        amountToCharge -= creditUsed;
      }

      if (amountToCharge <= 0) {
        await ctx.runMutation(internal.billing.recordCharge, {
          studentId: profile.studentId,
          billingProfileId: profile._id,
          amountCents: rate.totalCents,
          status: "credit_applied",
          weekStartDate: chargeDate,
          description: `Auto: ${dayOfWeek} ${chargeDate} — ${classDetails || "credit applied"}`,
        });
        await ctx.runMutation(internal.billing.insertCreditEntry, {
          studentId: profile.studentId,
          amountCents: -creditUsed,
          reason: "applied_to_charge",
          description: `Applied to ${dayOfWeek} ${chargeDate} — ${classDetails}`,
        });
        continue;
      }

      if (profile.paymentType === "cash") {
        await ctx.runMutation(internal.billing.recordCharge, {
          studentId: profile.studentId,
          billingProfileId: profile._id,
          amountCents: rate.totalCents,
          status: "cash",
          weekStartDate: chargeDate,
          description: `Auto: ${dayOfWeek} ${chargeDate} — ${classDetails || "cash"}`,
        });
        if (creditUsed > 0) {
          await ctx.runMutation(internal.billing.insertCreditEntry, {
            studentId: profile.studentId,
            amountCents: -creditUsed,
            reason: "applied_to_charge",
            description: `Partial credit applied to ${dayOfWeek} ${chargeDate} — ${classDetails}`,
          });
        }
        continue;
      }

      if (!profile.stripeCustomerId || !profile.stripePaymentMethodId) {
        await ctx.runMutation(internal.billing.recordCharge, {
          studentId: profile.studentId,
          billingProfileId: profile._id,
          amountCents: rate.totalCents,
          status: "failed",
          weekStartDate: chargeDate,
          failureReason: "No payment method on file",
          description: `Auto: ${dayOfWeek} ${chargeDate} — ${classDetails}`,
        });
        continue;
      }

      const student: { name: string; email?: string; parentEmail?: string } | null =
        await ctx.runQuery(internal.billing.getStudentInternal, { studentId: profile.studentId });
      const receiptEmail = student?.parentEmail || student?.email || undefined;

      try {
        const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
          amount: amountToCharge,
          currency: "aud",
          customer: profile.stripeCustomerId,
          payment_method: profile.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          receipt_email: receiptEmail,
          description: `Simple Tuition — ${dayOfWeek} ${chargeDate}${student ? ` (${student.name})` : ""}${classDetails ? ` — ${classDetails}` : ""}`,
          metadata: {
            studentId: profile.studentId,
            billingProfileId: profile._id,
            chargeDate,
            dayOfWeek,
            creditApplied: String(creditUsed),
          },
        });

        const succeeded: boolean = paymentIntent.status === "succeeded";

        await ctx.runMutation(internal.billing.recordCharge, {
          studentId: profile.studentId,
          billingProfileId: profile._id,
          amountCents: rate.totalCents,
          status: succeeded ? "succeeded" : "failed",
          weekStartDate: chargeDate,
          stripePaymentIntentId: paymentIntent.id,
          failureReason: succeeded
            ? undefined
            : `Payment status: ${paymentIntent.status}`,
          description: `Auto: ${dayOfWeek} ${chargeDate} — ${classDetails}`,
        });

        if (succeeded && creditUsed > 0) {
          await ctx.runMutation(internal.billing.insertCreditEntry, {
            studentId: profile.studentId,
            amountCents: -creditUsed,
            reason: "applied_to_charge",
            description: `Partial credit applied to ${dayOfWeek} ${chargeDate} — ${classDetails}`,
          });
        }
      } catch (err: any) {
        const friendlyError = formatStripeError(err);
        await ctx.runMutation(internal.billing.recordCharge, {
          studentId: profile.studentId,
          billingProfileId: profile._id,
          amountCents: rate.totalCents,
          status: "failed",
          weekStartDate: chargeDate,
          failureReason: friendlyError,
          description: `Auto: ${dayOfWeek} ${chargeDate} — ${classDetails}`,
        });
      }
    }

    return null;
  },
});
