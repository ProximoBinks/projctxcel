import { mutation, internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAdmin } from "./identity";
import { adelaideDate } from "../lib/adelaideDate";
import { paginationOptsValidator } from "convex/server";

async function ensureSummary(ctx: MutationCtx) {
  const existing = await ctx.db.query("billingRevenueSummary").withIndex("by_key", q => q.eq("key", "all")).unique();
  if (existing) return existing;
  const id = await ctx.db.insert("billingRevenueSummary", { key: "all", totalCents: 0, chargeCount: 0, legacyChargeCount: 0, ready: false, cursor: null });
  await ctx.scheduler.runAfter(0, internal.billingRevenue.backfill, {});
  return (await ctx.db.get(id))!;
}

/** Called in the same transaction that writes a charge; backfill uses the same deduplication key. */
export async function recordRevenue(ctx: MutationCtx, charge: Doc<"billingCharges">) {
  if (charge.status !== "succeeded") return;
  if (await ctx.db.query("billingRevenueContributions").withIndex("by_charge", q => q.eq("chargeId", charge._id)).unique()) return;
  const summary = await ensureSummary(ctx);
  const cents = charge.paidCents ?? charge.amountCents;
  await ctx.db.insert("billingRevenueContributions", { chargeId: charge._id });
  await ctx.db.patch(summary._id, { totalCents: summary.totalCents + cents, chargeCount: summary.chargeCount + 1, legacyChargeCount: summary.legacyChargeCount + (charge.paidCents === undefined ? 1 : 0) });
  const day = await ctx.db.query("billingRevenueDaily").withIndex("by_date", q => q.eq("date", charge.weekStartDate)).unique();
  if (day) await ctx.db.patch(day._id, { totalCents: day.totalCents + cents, chargeCount: day.chargeCount + 1 });
  else await ctx.db.insert("billingRevenueDaily", { date: charge.weekStartDate, totalCents: cents, chargeCount: 1 });
}

export const ensure = mutation({
  args: {},
  handler: async ctx => { await requireAdmin(ctx); await ensureSummary(ctx); },
});

export const backfill = internalMutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const summary = await ensureSummary(ctx);
    if (summary.ready) return;
    const page = await ctx.db.query("billingCharges").paginate({ numItems: 100, cursor: summary.cursor });
    for (const charge of page.page) await recordRevenue(ctx, charge);
    await ctx.db.patch(summary._id, { cursor: page.continueCursor, ready: page.isDone });
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.billingRevenue.backfill, {});
  },
});

export const stats = query({
  args: {},
  handler: async ctx => {
    await requireAdmin(ctx);
    const summary = await ctx.db.query("billingRevenueSummary").withIndex("by_key", q => q.eq("key", "all")).unique();
    if (!summary?.ready) return { ready: false, allTimeCents: 0, thisMonthCents: 0, thisWeekCents: 0, chargeCount: 0, legacyChargeCount: 0 };
    const today = adelaideDate();
    const monthStart = `${today.slice(0, 7)}-01`;
    const monday = new Date(`${today}T00:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    const weekStart = monday.toISOString().slice(0, 10);
    const days = await ctx.db.query("billingRevenueDaily").withIndex("by_date", q => q.gte("date", monthStart < weekStart ? monthStart : weekStart).lte("date", today)).collect();
    return { ready: true, allTimeCents: summary.totalCents, chargeCount: summary.chargeCount, legacyChargeCount: summary.legacyChargeCount,
      thisMonthCents: days.filter(d => d.date >= monthStart).reduce((sum, d) => sum + d.totalCents, 0),
      thisWeekCents: days.filter(d => d.date >= weekStart).reduce((sum, d) => sum + d.totalCents, 0),
    };
  },
});

export const chart = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    return await ctx.db.query("billingRevenueDaily").withIndex("by_date").order("desc").paginate(paginationOpts);
  },
});
