import { NextResponse } from "next/server";
import { getTransporter, getFromEmail } from "../../../lib/email";

export const runtime = "nodejs";

const PROGRAM_LABELS: Record<string, string> = {
  medicine: "Medicine",
  dentistry: "Dentistry",
  both: "Medicine + Dentistry",
};

/**
 * Notifies the admin the moment someone fills out the Interview Intensive
 * form — mirrors the main enquiry form's immediate notification email.
 *
 * Called by Convex's `courseEnrollments.notifyAdmin` action, not the browser.
 * Guarded by the same CONVEX_SERVER_SECRET used for the paid-confirmation
 * email, to prove the call is server-to-server.
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
    phone?: unknown;
    program?: unknown;
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const program = typeof body.program === "string" ? body.program : "";

  if (!name || !email) {
    return NextResponse.json(
      { message: "Name and email are required." },
      { status: 400 }
    );
  }

  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (!toEmail) {
    return NextResponse.json(
      { message: "CONTACT_TO_EMAIL is not configured." },
      { status: 500 }
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

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `Program: ${PROGRAM_LABELS[program] ?? (program || "Not provided")}`,
    "",
    "This is a new Interview Intensive signup. They may not have completed payment yet — check the admin dashboard for status.",
  ];

  try {
    await transporter.sendMail({
      from: `"Simple Tuition" <${fromEmail}>`,
      to: toEmail,
      replyTo: `"${name}" <${email}>`,
      subject: `New Interview Intensive signup - ${name}`,
      text: lines.join("\n"),
    });
  } catch (error) {
    console.error("Failed to send interview enrollment admin notification", error);
    return NextResponse.json(
      { message: "Failed to send notification email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Admin notification sent." });
}
