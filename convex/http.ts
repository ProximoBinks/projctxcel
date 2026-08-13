import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Stripe webhook endpoint.
 *
 * Lives at: https://<deployment>.convex.site/stripe/webhook
 *
 * This handler stays deliberately thin: it captures the *raw* body (signature
 * verification fails against a re-serialised body) and hands it to a Node
 * action, which is where the Stripe SDK can verify and process the event.
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const payload = await request.text();

    const result: { ok: boolean; message: string } = await ctx.runAction(
      internal.courseWebhook.handleStripeEvent,
      { payload, signature },
    );

    // 400 tells Stripe the event was not accepted (bad signature / bad payload)
    // so it stops retrying. Anything we handled — including events we choose to
    // ignore — returns 200 so Stripe does not retry indefinitely.
    return new Response(result.message, { status: result.ok ? 200 : 400 });
  }),
});

export default http;
