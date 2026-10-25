"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { adelaideTimestamp } from "../lib/adelaideDate";

const money = (cents: number) => `A$${(cents / 100).toFixed(2)}`;
// Keep user text on one line, bounded, and unable to create mentions or links.
const plain = (value: string, length: number) => value.replace(/[\r\n\t]/g, " ").replace(/[@<>*_`~|\\[\]()]/g, "").slice(0, length);

export function summaryPayload(day: Doc<"billingReviewDays">, lessons: Doc<"billingReviews">[]) {
  const lines = lessons.slice(0, 15).map(row =>
    `• ${plain(row.studentName, 40)} · ${plain(row.className, 40)} · ${plain(row.startTime, 5)}–${plain(row.endTime, 5)} · ${money(row.amountCents)} · ${row.status}`);
  const more = day.lessonCount - lines.length;
  const deadline = Math.floor(adelaideTimestamp(day.date) / 1000);
  return {
    allowed_mentions: { parse: [] },
    embeds: [{
      title: `Daily lesson review · ${day.date}`,
      color: 0x2563eb,
      description: [
        `**${day.lessonCount} student lessons · ${money(day.totalCents)} scheduled/adjusted total** (includes held lessons; before credit)`,
        `Awaiting review: **${day.pendingCount}** · Approved: **${day.approvedCount}** · Held: **${day.heldCount}** · Submitted: **${day.submittedCount}**`,
        `Approved total before credit: **${money(day.approvedCents)}**`,
        "",
        ...(lines.length ? lines : ["No billable scheduled lessons today."]),
        ...(more > 0 ? [`…and ${more} more. See the full list in Daily review.`] : []),
        "",
        `Approve completed lessons before **7pm Adelaide time** (<t:${deadline}:t>). Only approved lessons are submitted for payment; credits and payment type apply. Late approvals need a separate charge action.`,
        "This is a scheduled lesson summary, not confirmed attendance. Hold cancelled lessons before approving.",
        "[Open admin](https://simpletuition.com.au/admin) → **Billing → Daily review**. Select the date above.",
      ].join("\n"),
      timestamp: new Date().toISOString(),
    }],
  };
}

export const send = internalAction({
  args: { dayId: v.id("billingReviewDays") },
  returns: v.null(),
  handler: async (ctx, { dayId }): Promise<null> => {
    const claimed = await ctx.runMutation(internal.billingReviewNotifications.claim, { dayId });
    if (!claimed) return null;
    const { day, lessons, attempt } = claimed;
    const finish = (result: { status: "sent" | "failed" | "uncertain"; messageId?: string; error?: string; retryAfterMs?: number }) =>
      ctx.runMutation(internal.billingReviewNotifications.finish, { dayId, attempt, ...result });
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
      await finish({ status: "failed", error: "DISCORD_WEBHOOK_URL is not configured." });
      return null;
    }
    let url: URL;
    try { url = new URL(webhook); url.searchParams.set("wait", "true"); }
    catch {
      await finish({ status: "failed", error: "DISCORD_WEBHOOK_URL is invalid." });
      return null;
    }
    let result: Parameters<typeof finish>[0];
    try {
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryPayload(day, lessons)), signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        const body = await response.json();
        result = typeof body?.id === "string" ? { status: "sent", messageId: body.id }
          : { status: "uncertain", error: "Discord did not return a message ID. Check the channel." };
      } else if (response.status === 429) {
        const body = await response.json();
        const seconds = typeof body?.retry_after === "number" ? body.retry_after : Number(response.headers.get("retry-after"));
        result = { status: "failed", error: "Discord rate limit prevented delivery.", retryAfterMs: Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60_000 };
      } else {
        result = { status: response.status >= 500 ? "uncertain" : "failed", error: `Discord returned HTTP ${response.status}. Check the channel and webhook configuration.` };
      }
    } catch {
      result = { status: "uncertain", error: "Discord delivery could not be confirmed. Check the channel before resending." };
    }
    // Persist outside the network catch: a database error must not misreport a
    // successful send as a network failure or initiate another webhook POST.
    await finish(result);
    return null;
  },
});
