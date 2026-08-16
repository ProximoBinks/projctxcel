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

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Attribution signals for the Conversions API.
 *
 * The webhook that sends the server-side Purchase is a server-to-server call
 * from Stripe and never sees the visitor's browser, so these have to be read
 * here and carried on the enrollment record.
 *
 * `_fbc` is normally set by the pixel from the `fbclid` query parameter Meta
 * appends to ad clicks, but the cookie is not written until the pixel has
 * loaded — so on a fast click-through it may not exist yet. We fall back to
 * building it from `fbclid` ourselves, in Meta's required
 * `fb.<subdomainIndex>.<timestamp>.<fbclid>` format.
 */
export function getMetaAttribution(): {
  fbp?: string;
  fbc?: string;
  userAgent?: string;
} {
  if (typeof window === "undefined") return {};

  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  const fbc =
    readCookie("_fbc") ??
    (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);

  return {
    fbp: readCookie("_fbp"),
    fbc,
    userAgent: window.navigator.userAgent,
  };
}

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
