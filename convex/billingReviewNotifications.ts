import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { adelaideDate, adelaideTime } from "../lib/adelaideDate";

// The day is the outbox key. Refreshing the review never queues a second summary.
export async function queueSummary(ctx: MutationCtx, dayId: Id<"billingReviewDays">) {
  const day = await ctx.db.get(dayId);
  if (!day || day.status !== "ready" || day.discord || day.date !== adelaideDate() || adelaideTime() < "18:00") return;
  await ctx.db.patch(dayId, { discord: { status: "queued", attempts: 0, updatedAt: Date.now() } });
  await ctx.scheduler.runAfter(0, internal.billingSummaryDiscord.send, { dayId });
}

export const claim = internalMutation({
  args: { dayId: v.id("billingReviewDays") },
  handler: async (ctx, { dayId }) => {
    const day = await ctx.db.get(dayId);
    if (!day || day.discord?.status !== "queued" || (day.discord.retryAt ?? 0) > Date.now()) return null;
    if (day.status !== "ready") {
      await ctx.scheduler.runAfter(60_000, internal.billingSummaryDiscord.send, { dayId });
      return null;
    }
    const attempt = day.discord.attempts + 1;
    await ctx.db.patch(dayId, { discord: { status: "sending", attempts: attempt, updatedAt: Date.now() } });
    await ctx.scheduler.runAfter(120_000, internal.billingReviewNotifications.expire, { dayId, attempt });
    const lessons = await ctx.db.query("billingReviews").withIndex("by_day", q => q.eq("dayId", dayId)).take(15);
    return { day, lessons, attempt };
  },
});

export const finish = internalMutation({
  args: {
    dayId: v.id("billingReviewDays"), attempt: v.number(),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("uncertain")),
    messageId: v.optional(v.string()), error: v.optional(v.string()), retryAfterMs: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    const day = await ctx.db.get(args.dayId);
    if (!day?.discord || day.discord.attempts !== args.attempt || day.discord.status !== "sending") return;
    // Only explicit rate-limit rejections are safe to retry. A lost response may
    // already have delivered the message, so ambiguous failures stay visible.
    if (args.retryAfterMs !== undefined && Number.isFinite(args.retryAfterMs) && args.attempt < 3) {
      const delay = Math.max(1000, args.retryAfterMs);
      await ctx.db.patch(args.dayId, { discord: { status: "queued", attempts: args.attempt, updatedAt: Date.now(), retryAt: Date.now() + delay } });
      await ctx.scheduler.runAfter(delay, internal.billingSummaryDiscord.send, { dayId: args.dayId });
      return;
    }
    await ctx.db.patch(args.dayId, { discord: {
      status: args.status, attempts: args.attempt, updatedAt: Date.now(),
      sentAt: args.status === "sent" ? Date.now() : undefined,
      messageId: args.messageId, error: args.error,
    } });
  },
});

export const expire = internalMutation({
  args: { dayId: v.id("billingReviewDays"), attempt: v.number() },
  handler: async (ctx, { dayId, attempt }) => {
    const day = await ctx.db.get(dayId);
    if (day?.discord?.status === "sending" && day.discord.attempts === attempt && Date.now() - day.discord.updatedAt >= 120_000) {
      await ctx.db.patch(dayId, { discord: { ...day.discord, status: "uncertain", updatedAt: Date.now(), error: "Delivery was not confirmed. Check Discord before resending." } });
    }
  },
});
