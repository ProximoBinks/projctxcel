import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { assertServerSecret } from "./serverOnly";

// Fixed-window rate limiter. Called only from our API routes (server-secret
// gated) so it can't be abused to inflate counters or probe state. Convex-backed
// so the limit is shared across all serverless function instances.
export const checkRateLimit = mutation({
  args: {
    key: v.string(),
    maxAttempts: v.number(),
    windowMs: v.number(),
    serverSecret: v.string(),
  },
  returns: v.object({ allowed: v.boolean(), retryAfterMs: v.number() }),
  handler: async (ctx, { key, maxAttempts, windowMs, serverSecret }) => {
    assertServerSecret(serverSecret);
    const now = Date.now();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    // No window yet, or the previous window has expired → start fresh.
    if (!existing || now - existing.windowStart >= windowMs) {
      if (existing) {
        await ctx.db.patch(existing._id, { count: 1, windowStart: now });
      } else {
        await ctx.db.insert("rateLimits", { key, count: 1, windowStart: now });
      }
      return { allowed: true, retryAfterMs: 0 };
    }

    if (existing.count >= maxAttempts) {
      return { allowed: false, retryAfterMs: existing.windowStart + windowMs - now };
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, retryAfterMs: 0 };
  },
});

// Periodic cleanup of stale counters (anything older than a day).
export const cleanupRateLimits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stale = await ctx.db.query("rateLimits").collect();
    for (const row of stale) {
      if (row.windowStart < cutoff) await ctx.db.delete(row._id);
    }
    return null;
  },
});
