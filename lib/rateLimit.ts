import "server-only";
import { convex } from "./convexServer";
import { api } from "../convex/_generated/api";
import { getServerSecret } from "./serverSecret";

function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

type Result = { allowed: boolean; retryAfterMs: number };

/**
 * Rate-limit a request by route name + client IP. Fails OPEN (allows the
 * request) if the limiter itself errors, so a Convex hiccup can never lock
 * legitimate users out of login/reset.
 */
export async function rateLimit(
  req: Request,
  name: string,
  opts: { maxAttempts: number; windowMs: number },
): Promise<Result> {
  try {
    return await convex.mutation(api.rateLimit.checkRateLimit, {
      key: `${name}:${clientIp(req)}`,
      maxAttempts: opts.maxAttempts,
      windowMs: opts.windowMs,
      serverSecret: getServerSecret(),
    });
  } catch {
    return { allowed: true, retryAfterMs: 0 };
  }
}

export function tooManyRequests(retryAfterMs: number): Response {
  const retryAfter = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, retryAfter)),
      },
    },
  );
}
