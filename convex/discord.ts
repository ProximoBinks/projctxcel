"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export async function sendDiscordNotification(
  title: string,
  description: string,
  color = 0x2563eb,
) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description,
            color,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    console.error("Discord webhook failed");
  }
}

export const notify = internalAction({
  args: {
    title: v.string(),
    description: v.string(),
    color: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (_ctx, { title, description, color }) => {
    await sendDiscordNotification(title, description, color ?? 0x2563eb);
    return null;
  },
});
