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
