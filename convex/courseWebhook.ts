"use node";

import Stripe from "stripe";
import { createHash } from "crypto";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { sendDiscordNotification } from "./discord";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Copy the signing secret from the " +
        "Stripe Dashboard webhook endpoint and run: " +
        "npx convex env set STRIPE_WEBHOOK_SECRET whsec_xxx",
    );
  }
  return secret;
}

const PROGRAM_LABELS: Record<string, string> = {
  medicine: "Medicine",
  dentistry: "Dentistry",
  both: "Medicine + Dentistry",
};

/**
 * Posts the branded confirmation email by calling our own Next.js route, which
 * owns the nodemailer transport and the HTML templates in `emails/`. Doing it
 * this way avoids standing up a second email stack inside Convex.
 *
 * Failure here must never fail the webhook — the payment already succeeded and
 * the enrollment is recorded; Stripe should not retry over a missing email.
 */
async function sendConfirmationEmail(fields: {
  name: string;
  email: string;
  program: string;
  amountCents: number;
}): Promise<void> {
  const siteUrl = process.env.SITE_URL ?? "https://simpletuition.com.au";
  const secret = process.env.CONVEX_SERVER_SECRET;
  if (!secret) {
    console.error("CONVEX_SERVER_SECRET not set — skipping confirmation email");
    return;
  }

  try {
    const response = await fetch(`${siteUrl}/api/enrollment-confirmation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-server-secret": secret,
      },
      body: JSON.stringify(fields),
    });
    if (!response.ok) {
      console.error(
        `Confirmation email route returned ${response.status}`,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("Failed to send enrollment confirmation email", error);
  }
}

const META_GRAPH_VERSION = "v21.0";

/**
 * The pixel the Conversions API reports to. Must be the same pixel the browser
 * initialises via NEXT_PUBLIC_META_PIXEL_ID — if the two drift apart, the
 * shared event_id stops deduplicating and each pixel sees half the picture.
 */
function getMetaPixelId(): string | undefined {
  return process.env.META_PIXEL_ID;
}

/** Meta requires user identifiers to be SHA-256 of the normalised value. */
function hashForMeta(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Server-side Purchase event via Meta's Conversions API.
 *
 * `eventId` is the Stripe Checkout Session id, which the browser also sends on
 * the success page — Meta collapses the pair into one conversion. Sending both
 * is deliberate: the server call still lands when an ad blocker or an
 * abandoned redirect stops the browser one.
 *
 * Like the confirmation email, a failure here must never fail the webhook. The
 * payment has already succeeded; Stripe must not retry over analytics.
 */
async function sendMetaPurchaseEvent(fields: {
  eventId: string;
  email: string;
  amountCents: number;
  eventSourceUrl: string;
}): Promise<void> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!accessToken) {
    // TODO: set META_CAPI_ACCESS_TOKEN (System User token from Meta Events
    // Manager) with: npx convex env set META_CAPI_ACCESS_TOKEN <token>
    console.warn(
      "META_CAPI_ACCESS_TOKEN not set — skipping Conversions API Purchase event",
    );
    return;
  }

  const pixelId = getMetaPixelId();
  if (!pixelId) {
    console.warn("META_PIXEL_ID not set — skipping Conversions API Purchase event");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: fields.eventId,
              event_source_url: fields.eventSourceUrl,
              action_source: "website",
              user_data: { em: [hashForMeta(fields.email)] },
              custom_data: {
                value: fields.amountCents / 100,
                currency: "AUD",
                content_name: "Interview Intensive",
              },
            },
          ],
        }),
      },
    );

    const body = await response.text();
    if (!response.ok) {
      console.error(`Meta Conversions API returned ${response.status}`, body);
    }
  } catch (error) {
    console.error("Failed to send Meta Conversions API Purchase event", error);
  }
}

export const handleStripeEvent = internalAction({
  args: { payload: v.string(), signature: v.string() },
  returns: v.object({ ok: v.boolean(), message: v.string() }),
  handler: async (ctx, { payload, signature }): Promise<{ ok: boolean; message: string }> => {
    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        getWebhookSecret(),
      );
    } catch (error: any) {
      // Unverified payloads are rejected outright — never trust the body.
      console.error("Stripe webhook signature verification failed", error);
      return { ok: false, message: `Signature verification failed: ${error?.message ?? "unknown"}` };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const enrollmentId = session.metadata?.enrollmentId as
      | Id<"courseEnrollments">
      | undefined;

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        if (!enrollmentId) {
          // Not one of ours (or metadata was stripped) — acknowledge and move on.
          return { ok: true, message: "No enrollmentId in metadata; ignored" };
        }

        // With dynamic payment methods some methods settle asynchronously, so a
        // completed session is not automatically a paid one.
        if (session.payment_status !== "paid") {
          return {
            ok: true,
            message: `Session ${session.id} completed but payment_status=${session.payment_status}; awaiting settlement`,
          };
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        const result: {
          updated: boolean;
          name: string;
          email: string;
          program: string;
          amountCents: number;
          interviewDate?: string;
        } = await ctx.runMutation(internal.courseEnrollments.markPaid, {
          enrollmentId,
          stripePaymentIntentId: paymentIntentId,
          amountCents: session.amount_total ?? undefined,
        });

        // Stripe retries and can deliver duplicates; only notify on the
        // transition so the team never sees the same enrollment twice.
        if (!result.updated) {
          return { ok: true, message: "Already marked paid; no action taken" };
        }

        await sendDiscordNotification(
          "Interview Course Enrollment",
          [
            `**Name:** ${result.name}`,
            `**Email:** ${result.email}`,
            `**Program:** ${PROGRAM_LABELS[result.program] ?? result.program}`,
            `**Amount:** $${(result.amountCents / 100).toFixed(2)} AUD`,
            ...(result.interviewDate
              ? [`**Interview date:** ${result.interviewDate}`]
              : []),
          ].join("\n"),
          0x10b981,
        );

        await sendConfirmationEmail({
          name: result.name,
          email: result.email,
          program: result.program,
          amountCents: result.amountCents,
        });

        await sendMetaPurchaseEvent({
          // Shared with the browser-side Purchase on /interview/success, which
          // reads this same id from the `session_id` query parameter.
          eventId: session.id,
          email: result.email,
          amountCents: result.amountCents,
          eventSourceUrl: `${
            process.env.SITE_URL ?? "https://simpletuition.com.au"
          }/interview/success`,
        });

        await ctx.runAction(internal.googleSheets.updateEnrollmentStatus, {
          enrollmentId,
          status: "paid",
          amountCents: result.amountCents,
        });

        return { ok: true, message: "Enrollment marked paid" };
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        if (!enrollmentId) {
          return { ok: true, message: "No enrollmentId in metadata; ignored" };
        }
        const failedResult = await ctx.runMutation(
          internal.courseEnrollments.markFailed,
          { enrollmentId },
        );

        await ctx.runAction(internal.googleSheets.updateEnrollmentStatus, {
          enrollmentId,
          status: "failed",
          amountCents: failedResult.amountCents,
        });

        return { ok: true, message: `Enrollment marked failed (${event.type})` };
      }

      default:
        return { ok: true, message: `Unhandled event type ${event.type}` };
    }
  },
});
