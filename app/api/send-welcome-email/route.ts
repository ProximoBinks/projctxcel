import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getTransporter, getFromEmail } from "../../../lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { emails?: unknown };
  const emails = body.emails;

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json(
      { message: "Provide at least one email address." },
      { status: 400 }
    );
  }

  // Parse each entry as "email" or "email, Name"
  const parsed = (emails as unknown[])
    .map((e) => {
      const parts = String(e).split(",");
      const email = parts[0].trim();
      const rawName = parts[1]?.trim() ?? "";
      const name = rawName
        ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
        : "";
      return { email, name };
    })
    .filter(({ email }) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  if (parsed.length === 0) {
    return NextResponse.json(
      { message: "No valid email addresses provided." },
      { status: 400 }
    );
  }

  let transporter: ReturnType<typeof getTransporter>;
  let fromEmail: string;
  try {
    transporter = getTransporter();
    fromEmail = getFromEmail();
  } catch {
    return NextResponse.json(
      { message: "Email service is not configured." },
      { status: 500 }
    );
  }

  const templatePath = path.join(process.cwd(), "emails", "welcome.html");
  let htmlContent: string;
  try {
    htmlContent = fs.readFileSync(templatePath, "utf-8");
  } catch {
    return NextResponse.json(
      { message: "Could not load email template." },
      { status: 500 }
    );
  }

  const failed: string[] = [];
  for (const { email, name } of parsed) {
    const greeting = name ? `Welcome, ${name}` : "Welcome";
    const personalised = htmlContent.replace("{{GREETING}}", greeting);
    try {
      await transporter.sendMail({
        from: `"Simple Tuition" <${fromEmail}>`,
        to: email,
        subject: "Welcome to Simple Tuition",
        html: personalised,
      });
    } catch {
      failed.push(email);
    }
  }

  if (failed.length === parsed.length) {
    return NextResponse.json(
      { message: "Failed to send all emails. Check SMTP configuration." },
      { status: 500 }
    );
  }

  const sent = parsed.length - failed.length;
  return NextResponse.json({ message: `Sent to ${sent} of ${parsed.length} address${parsed.length !== 1 ? "es" : ""}.`, sent, failed });
}
