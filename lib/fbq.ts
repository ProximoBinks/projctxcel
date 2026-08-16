/**
 * Meta Pixel helpers.
 *
 * The base script is installed in `app/layout.tsx`. Everything here is a
 * no-op until it has loaded, and a no-op forever if the pixel is blocked by
 * an ad blocker or `NEXT_PUBLIC_META_PIXEL_ID` is unset — tracking must never
 * be able to break a page, least of all the checkout flow.
 */

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      queue?: unknown[];
      loaded?: boolean;
    };
    _fbq?: unknown;
  }
}

/** Standard Meta events we send. Kept narrow so typos fail the build. */
export type FbStandardEvent = "PageView" | "InitiateCheckout" | "Purchase";

/**
 * Fires a standard Meta Pixel event.
 *
 * `eventId` is Meta's deduplication key: when the same event is also sent
 * server-side through the Conversions API with the same id, Meta counts it
 * once rather than twice.
 */
export function trackFb(
  event: FbStandardEvent,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    if (eventId) {
      window.fbq("track", event, params ?? {}, { eventID: eventId });
    } else {
      window.fbq("track", event, params ?? {});
    }
  } catch (error) {
    // Never let analytics throw into a user-facing path.
    console.warn("Meta Pixel event failed", event, error);
  }
}
