import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getTransporter, getFromEmail } from "../../../lib/email";

export const runtime = "nodejs";

const PROGRAM_LABELS: Record<string, string> = {
  medicine: "Medicine",
  dentistry: "Dentistry",
  both: "Medicine + Dentistry",
};

/**
 * Sends the Interview Intensive confirmation email.
 *
 * Called by the Convex Stripe webhook, not the browser — Convex owns the payment
 * lifecycle but cannot read the `emails/` templates, so the send lives here where
 * the existing nodemailer transport and templates already are. Guarded by the
 * same CONVEX_SERVER_SECRET used elsewhere to prove a call is server-to-server.
 */
export async function POST(request: Request) {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected) {
    return NextResponse.json(
      { message: "CONVEX_SERVER_SECRET is not configured." },
      { status: 500 }
    );
  }
  if (request.headers.get("x-server-secret") !== expected) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: unknown;
    email?: unknown;
    program?: unknown;
    amountCents?: unknown;
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const program = typeof body.program === "string" ? body.program : "";
  const amountCents =
    typeof body.amountCents === "number" ? body.amountCents : NaN;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { message: "A valid email is required." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(amountCents)) {
    return NextResponse.json(
      { message: "amountCents must be a number." },
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

  const templatePath = path.join(
    process.cwd(),
    "emails",
    "interview-enrollment.html"
  );
  let html: string;
  try {
    html = fs.readFileSync(templatePath, "utf-8");
  } catch {
    return NextResponse.json(
      { message: "Could not load email template." },
      { status: 500 }
    );
  }

  const firstName = name.split(/\s+/)[0] || "there";
  html = html
    .replaceAll("{{NAME}}", firstName)
    .replaceAll(
      "{{PROGRAM}}",
      PROGRAM_LABELS[program] ?? "Interview Crash Course 2026"
    )
    .replaceAll("{{AMOUNT}}", `$${(amountCents / 100).toFixed(2)}`);

  try {
    await transporter.sendMail({
      from: `"Simple Tuition" <${fromEmail}>`,
      to: email,
      subject: "You're enrolled — Interview Crash Course 2026, 6–9 October",
      html,
    });
  } catch (error) {
    console.error("Failed to send enrollment confirmation", error);
    return NextResponse.json(
      { message: "Failed to send confirmation email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Confirmation email sent." });
}
