import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertServerSecret } from "./serverOnly";
import { requireAdmin } from "./identity";
import { isEmail, MAX_RECIPIENTS, missingFields } from "../lib/emailPersonalization";

const greeting = v.object({ greeting: v.string(), nameStyle: v.union(v.literal("first"), v.literal("full")), fallbackName: v.string() });
const recipient = v.object({ email: v.string(), name: v.string(), fields: v.record(v.string(), v.string()) });

export const create = mutation({
  args: { serverSecret: v.string(), adminId: v.id("tutorAccounts"), requestId: v.string(), subject: v.string(), html: v.string(), text: v.string(), from: v.string(), senderName: v.string(), replyTo: v.string(), greeting, recipients: v.array(recipient), isTest: v.boolean() },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.active || !admin.roles?.includes("admin")) throw new Error("Unauthorized");
    const existing = await ctx.db.query("emailCampaigns").withIndex("by_request", q => q.eq("adminId", args.adminId).eq("requestId", args.requestId)).unique();
    if (existing) return existing._id;
    if (!process.env.POSTMARK_SERVER_TOKEN) throw new Error("Postmark is not configured for background sending.");
    if (!args.recipients.length || args.recipients.length > MAX_RECIPIENTS || (args.isTest && args.recipients.length !== 1)) throw new Error("Invalid recipient count.");
    if (args.recipients.some(r => !isEmail(r.email)) || new Set(args.recipients.map(r => r.email.toLowerCase())).size !== args.recipients.length) throw new Error("Invalid or duplicate recipients.");
    if (missingFields(args.subject + args.html, args.recipients, args.greeting).length) throw new Error("Some personalisation fields are missing.");
    const { serverSecret: _secret, recipients, ...campaign } = args;
    const campaignId = await ctx.db.insert("emailCampaigns", { ...campaign, stream: process.env.POSTMARK_BROADCAST_STREAM || "default-broadcast-stream", status: "sending", total: recipients.length, accepted: 0, failed: 0, uncertain: 0, createdAt: Date.now() });
    for (const person of recipients) await ctx.db.insert("emailDeliveries", { campaignId, ...person, status: "pending", updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.emailDelivery.sendBatch, { campaignId });
    return campaignId;
  },
});

export const list = query({
  args: {},
  handler: async ctx => {
    await requireAdmin(ctx);
    const campaigns = await ctx.db.query("emailCampaigns").order("desc").take(20);
    return campaigns.map(({ html: _html, text: _text, greeting: _greeting, ...summary }) => summary);
  },
});

export const results = query({
  args: { campaignId: v.id("emailCampaigns") },
  handler: async (ctx, { campaignId }) => {
    await requireAdmin(ctx);
    return await ctx.db.query("emailDeliveries").withIndex("by_campaign_status", q => q.eq("campaignId", campaignId)).take(MAX_RECIPIENTS);
  },
});

export const cancel = mutation({
  args: { campaignId: v.id("emailCampaigns") },
  handler: async (ctx, { campaignId }) => {
    await requireAdmin(ctx);
    const campaign = await ctx.db.get(campaignId);
    if (campaign?.status === "sending") await ctx.db.patch(campaignId, { status: "cancelled" });
  },
});

export const claim = internalMutation({
  args: { campaignId: v.id("emailCampaigns") },
  handler: async (ctx, { campaignId }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign || campaign.status !== "sending") return null;
    const inFlight = await ctx.db.query("emailDeliveries").withIndex("by_campaign_status", q => q.eq("campaignId", campaignId).eq("status", "sending")).first();
    if (inFlight) return null;
    const recipients = await ctx.db.query("emailDeliveries").withIndex("by_campaign_status", q => q.eq("campaignId", campaignId).eq("status", "pending")).take(50);
    if (!recipients.length) { await ctx.db.patch(campaignId, { status: "complete" }); return null; }
    for (const r of recipients) await ctx.db.patch(r._id, { status: "sending", updatedAt: Date.now() });
    // Recover the queue after a crashed action, but never resend an uncertain message.
    await ctx.scheduler.runAfter(120000, internal.emailCampaigns.recover, { campaignId, ids: recipients.map(r => r._id) });
    return { campaign, recipients };
  },
});

export const finish = internalMutation({
  args: { campaignId: v.id("emailCampaigns"), results: v.array(v.object({ id: v.id("emailDeliveries"), status: v.union(v.literal("accepted"), v.literal("failed"), v.literal("uncertain")), messageId: v.optional(v.string()), error: v.optional(v.string()) })) },
  handler: async (ctx, { campaignId, results }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) return;
    const counts = { accepted: campaign.accepted, failed: campaign.failed, uncertain: campaign.uncertain };
    for (const result of results) {
      const row = await ctx.db.get(result.id);
      if (!row || row.campaignId !== campaignId || row.status !== "sending") continue;
      const { id, ...patch } = result;
      await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
      counts[result.status]++;
    }
    const done = counts.accepted + counts.failed + counts.uncertain >= campaign.total;
    await ctx.db.patch(campaignId, { ...counts, status: campaign.status === "cancelled" ? "cancelled" : done ? "complete" : "sending" });
    if (!done && campaign.status !== "cancelled") await ctx.scheduler.runAfter(1000, internal.emailDelivery.sendBatch, { campaignId });
  },
});

export const recover = internalMutation({
  args: { campaignId: v.id("emailCampaigns"), ids: v.array(v.id("emailDeliveries")) },
  handler: async (ctx, { campaignId, ids }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) return;
    let uncertain = campaign.uncertain;
    for (const id of ids) {
      const row = await ctx.db.get(id);
      if (row?.status === "sending" && row.campaignId === campaignId) {
        await ctx.db.patch(id, { status: "uncertain", error: "Delivery result was interrupted. Check Postmark before resending.", updatedAt: Date.now() });
        uncertain++;
      }
    }
    if (uncertain === campaign.uncertain) return;
    const done = campaign.accepted + campaign.failed + uncertain >= campaign.total;
    await ctx.db.patch(campaignId, { uncertain, status: campaign.status === "cancelled" ? "cancelled" : done ? "complete" : "sending" });
    if (!done && campaign.status !== "cancelled") await ctx.scheduler.runAfter(0, internal.emailDelivery.sendBatch, { campaignId });
  },
});
