"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { personalize } from "../lib/emailPersonalization";
import type { Doc, Id } from "./_generated/dataModel";

type Result = { id: Id<"emailDeliveries">; status: "accepted" | "failed" | "uncertain"; messageId?: string; error?: string };

export const sendBatch = internalAction({
  args: { campaignId: v.id("emailCampaigns") },
  handler: async (ctx, { campaignId }): Promise<void> => {
    const batch: { campaign: Doc<"emailCampaigns">; recipients: Doc<"emailDeliveries">[] } | null = await ctx.runMutation(internal.emailCampaigns.claim, { campaignId });
    if (!batch) return;
    const { campaign, recipients } = batch;
    let results: Result[];
    try {
      const token = process.env.POSTMARK_SERVER_TOKEN;
      if (!token) {
        results = recipients.map(r => ({ id: r._id, status: "failed", error: "Postmark is not configured." }));
      } else {
        const response = await fetch("https://api.postmarkapp.com/email/batch", {
          method: "POST",
          headers: { "X-Postmark-Server-Token": token, "Content-Type": "application/json", Accept: "application/json" },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify(recipients.map(r => ({
            From: `"${campaign.senderName.replace(/["\\]/g, "")}" <${campaign.from}>`,
            To: r.email, ReplyTo: campaign.replyTo,
            Subject: personalize(campaign.subject, r, campaign.greeting),
            HtmlBody: personalize(campaign.html, r, campaign.greeting, true),
            TextBody: personalize(campaign.text, r, campaign.greeting),
            MessageStream: campaign.stream,
            TrackOpens: false, TrackLinks: "None",
            Metadata: { campaignId, deliveryId: r._id },
          }))),
        });
        const data = await response.json();
        if (!response.ok) {
          const status = response.status >= 500 ? "uncertain" : "failed";
          results = recipients.map(r => ({ id: r._id, status, error: String(data.Message || `Postmark returned ${response.status}`).slice(0,500) }));
        } else if (!Array.isArray(data) || data.length !== recipients.length) {
          throw new Error("Unexpected Postmark response");
        } else {
          results = recipients.map((r, i) => data[i].ErrorCode === 0
            ? { id: r._id, status: "accepted", messageId: data[i].MessageID }
            : { id: r._id, status: "failed", error: String(data[i].Message || "Postmark rejected this recipient").slice(0,500) });
        }
      }
    } catch {
      results = recipients.map(r => ({ id: r._id, status: "uncertain", error: "Postmark's response could not be confirmed. Check Postmark before resending." }));
    }
    await ctx.runMutation(internal.emailCampaigns.finish, { campaignId, results });
  },
});
