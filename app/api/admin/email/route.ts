import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { verifyAuthToken } from "../../../../lib/auth";
import { prepareEmailHtml } from "../../../../lib/emailHtml";
import { parseRecipients } from "../../../../lib/emailRecipients";
import { DEFAULT_GREETING, GreetingOptions, isEmail, MAX_HTML_BYTES, missingFields, personalize } from "../../../../lib/emailPersonalization";
import { convex } from "../../../../lib/convexServer";
import { getServerSecret } from "../../../../lib/serverSecret";
import { getFromEmail } from "../../../../lib/email";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const runtime = "nodejs";

async function adminSession() {
  const token = (await cookies()).get("auth_token")?.value;
  const session = token ? await verifyAuthToken(token) : null;
  return session?.type === "admin" && session.roles.includes("admin") ? session : null;
}

export async function GET() {
  if (!await adminSession()) return NextResponse.json({ message: "Admin sign-in required." }, { status: 401 });
  const [workshop, welcome] = await Promise.all(["interview-workshop-email.html", "welcome.html"].map(file => readFile(path.join(process.cwd(), "emails", file), "utf8")));
  return NextResponse.json({ from: getFromEmail(), templates: [
    { id: "workshop", label: "Interview workshop", subject: "Get ready for the Medicine & Dentistry Interview Crash Course", html: workshop },
    { id: "welcome", label: "Welcome to Simple Tuition", subject: "Welcome to Simple Tuition", html: welcome },
  ] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ message: "Admin sign-in required." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 1_500_000) return NextResponse.json({ message: "Request is too large. Use up to 5,000 contacts and an HTML file under 250 KB." }, { status: 413 });
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error("Invalid request.");
    const { action, html, subject, senderName, replyTo, recipientInput, requestId } = body;
    if (!["preview", "send", "test"].includes(action)) throw new Error("Invalid email action.");
    if (typeof html !== "string" || typeof subject !== "string" || !subject.trim() || subject.length > 200 || /[\r\n]/.test(subject)) throw new Error("Enter a subject of up to 200 characters on one line.");
    const options: GreetingOptions = body.greeting || DEFAULT_GREETING;
    if (!["first", "full"].includes(options.nameStyle) || typeof options.greeting !== "string" || options.greeting.length > 60 || typeof options.fallbackName !== "string" || !options.fallbackName.trim() || options.fallbackName.length > 100 || /[\r\n]/.test(options.greeting + options.fallbackName)) throw new Error("Check your greeting and fallback name.");
    if (typeof recipientInput !== "string") throw new Error("Enter recipients or import a CSV.");
    const parsed = parseRecipients(recipientInput);
    if (parsed.errors.length) throw new Error(parsed.errors.slice(0, 4).join(" "));
    const sample = parsed.recipients[0] || { email: "alex@example.com", name: "Alex Taylor", fields: {} };
    const prepared = prepareEmailHtml(html);
    const missing = missingFields(subject + prepared.html, parsed.recipients.length ? parsed.recipients : [sample], options);
    if (missing.length) throw new Error(`Missing CSV columns for: ${missing.join(", ")}. Add those columns or remove the placeholders.`);
    const previewHtml = personalize(prepared.html, sample, options, true);
    const previewText = personalize(prepared.text, sample, options);
    if (action === "preview") return NextResponse.json({ html: previewHtml, text: previewText, subject: personalize(subject, sample, options), bytes: Buffer.byteLength(previewHtml), recipients: parsed.recipients.length, duplicates: parsed.duplicates });
    if (!parsed.recipients.length) throw new Error("Add at least one valid recipient.");
    if (action === "test" && parsed.recipients.length !== 1) throw new Error("A test sends to one address only.");
    if (typeof senderName !== "string" || !senderName.trim() || senderName.length > 100 || /[\r\n<>]/.test(senderName)) throw new Error("Enter a valid sender display name.");
    if (typeof replyTo !== "string" || !isEmail(replyTo)) throw new Error("Enter a valid reply-to address.");
    if (typeof requestId !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) throw new Error("Invalid campaign request. Reload and try again.");
    for (const r of parsed.recipients) {
      if (Buffer.byteLength(personalize(prepared.html, r, options, true)) > MAX_HTML_BYTES) throw new Error("Personalised HTML exceeds 90 KB. Shorten the template or custom fields.");
      if (personalize(subject, r, options).length > 200) throw new Error("A personalised subject exceeds 200 characters.");
    }
    const campaignId = await convex.mutation(api.emailCampaigns.create, {
      serverSecret: getServerSecret(), adminId: session.id as Id<"tutorAccounts">,
      requestId, subject: action === "test" ? `[Test] ${subject.trim()}` : subject.trim(),
      html: prepared.html, text: prepared.text, from: getFromEmail(), senderName: senderName.trim(), replyTo,
      greeting: options, recipients: parsed.recipients, isTest: action === "test",
    });
    return NextResponse.json({ campaignId, message: `${parsed.recipients.length} email${parsed.recipients.length === 1 ? "" : "s"} queued. Progress is saved in campaign history.` });
  } catch (error) {
    const message = error instanceof SyntaxError ? "Invalid request JSON." : error instanceof Error && !error.message.includes("[Request ID:") ? error.message : "Could not queue the campaign. Check campaign history before trying again.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
