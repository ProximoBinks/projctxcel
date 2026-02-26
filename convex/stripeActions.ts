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
      const rate: { totalCents: number } = await ctx.runQuery(
        internal.billing.calculateDailyRate,
        { studentId: profile.studentId, dayOfWeek, referenceDate: chargeDate },
      );

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
        });
        await ctx.runMutation(internal.billing.insertCreditEntry, {
          studentId: profile.studentId,
          amountCents: -creditUsed,
          reason: "applied_to_charge",
          description: `Applied to ${dayOfWeek} ${chargeDate}`,
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
        });
        if (creditUsed > 0) {
          await ctx.runMutation(internal.billing.insertCreditEntry, {
            studentId: profile.studentId,
            amountCents: -creditUsed,
            reason: "applied_to_charge",
            description: `Partial credit applied to ${dayOfWeek} ${chargeDate}`,
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
        });
        continue;
      }

      try {
        const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
          amount: amountToCharge,
          currency: "aud",
          customer: profile.stripeCustomerId,
          payment_method: profile.stripePaymentMethodId,
          off_session: true,
          confirm: true,
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
        });

        if (succeeded && creditUsed > 0) {
          await ctx.runMutation(internal.billing.insertCreditEntry, {
            studentId: profile.studentId,
            amountCents: -creditUsed,
            reason: "applied_to_charge",
            description: `Partial credit applied to ${dayOfWeek} ${chargeDate}`,
          });
        }
      } catch (err: any) {
        await ctx.runMutation(internal.billing.recordCharge, {
          studentId: profile.studentId,
          billingProfileId: profile._id,
          amountCents: rate.totalCents,
          status: "failed",
          weekStartDate: chargeDate,
          failureReason: err.message ?? "Unknown error",
        });
      }
    }

    return null;
  },
});
