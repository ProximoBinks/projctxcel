"use node";

import Stripe from "stripe";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Mirrors the helper in stripeActions.ts. Kept local so this file stays
// independent of the off-session charging logic used for enrolled students.
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function getPriceId(): string {
  const priceId = process.env.STRIPE_INTERVIEW_COURSE_PRICE_ID;
  if (!priceId) {
    throw new Error(
      "STRIPE_INTERVIEW_COURSE_PRICE_ID is not set. Create the one-time AUD " +
        "Price in the Stripe Dashboard and run: " +
        "npx convex env set STRIPE_INTERVIEW_COURSE_PRICE_ID price_xxx",
    );
  }
  return priceId;
}

/**
 * Creates a Stripe Checkout Session for a pending enrollment and returns the
 * hosted Checkout URL for the browser to redirect to.
 *
 * `origin` comes from the caller so the success/cancel URLs work across
 * localhost, Netlify previews and production without another env var.
 */
export const createCheckoutSession = action({
  args: {
    enrollmentId: v.id("courseEnrollments"),
    origin: v.string(),
  },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, { enrollmentId, origin }): Promise<{ url: string }> => {
    // Only allow http(s) origins we constructed client-side, so a crafted value
    // cannot turn our Checkout redirect into an open redirect to another host.
    if (!/^https?:\/\/[^\s/]+$/.test(origin)) {
      throw new Error("Invalid origin");
    }

    type Enrollment = {
      _id: Id<"courseEnrollments">;
      name: string;
      email: string;
      program: string;
      status: string;
      amountCents: number;
      interviewDate?: string;
    } | null;

    const enrollment: Enrollment = await ctx.runQuery(
      internal.courseEnrollments.getInternal,
      { enrollmentId },
    );

    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.status === "paid") {
      throw new Error("This enrollment has already been paid.");
    }

    const stripe = getStripe();

    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: getPriceId(), quantity: 1 }],
      customer_email: enrollment.email,
      client_reference_id: enrollmentId,
      // The webhook is the source of truth for fulfilment and reads this.
      metadata: {
        enrollmentId,
        program: enrollment.program,
        course: "interview_intensive",
      },
      // Checkout only shows the promo-code field when the session asks for it.
      // Enabling codes in the Dashboard alone has no effect on API-created
      // sessions.
      allow_promotion_codes: true,
      payment_intent_data: {
        description: `Simple Tuition Interview Crash Course 2026 (${enrollment.program})`,
        metadata: { enrollmentId, course: "interview_intensive" },
      },
      success_url: `${origin}/interview/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/interview?checkout=cancelled`,
      // payment_method_types is deliberately omitted so Stripe serves dynamic
      // payment methods, configured from the Dashboard without a redeploy.
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL");
    }

    await ctx.runMutation(internal.courseEnrollments.setCheckoutSession, {
      enrollmentId,
      stripeCheckoutSessionId: session.id,
    });

    return { url: session.url };
  },
});
