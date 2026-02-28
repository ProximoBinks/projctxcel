import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { convex } from "../../../../lib/convexServer";
import { api } from "../../../../convex/_generated/api";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  let payload:
    | { name?: string; email?: string; password?: string; secretCode?: string }
    | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const name = payload?.name?.trim() ?? "";
  const email = payload?.email?.trim() ?? "";
  const password = payload?.password ?? "";
  const secretCode = payload?.secretCode ?? "";

  if (!name || !email || !password || !secretCode) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const signupSecret = process.env.TUTOR_SIGNUP_SECRET;
  if (!signupSecret) {
    return NextResponse.json(
      { error: "Tutor signup is not configured." },
      { status: 500 }
    );
  }

  if (secretCode !== signupSecret) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
  }

  const fromEmail = process.env.POSTMARK_FROM_EMAIL;
  const smtpUser = process.env.POSTMARK_SMTP_USER;
  const smtpPass = process.env.POSTMARK_SMTP_PASS;

  if (!fromEmail || !smtpUser || !smtpPass) {
    return NextResponse.json(
      { error: "Email service is not configured." },
      { status: 500 }
    );
  }

  const result = await convex.mutation(api.auth.createTutorAccount, {
    name,
    email,
    password,
    hourlyRate: 5000,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Unable to create account." },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.postmarkapp.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `"Simple Tuition" <${fromEmail}>`,
    to: email,
    subject: "Your Simple Tuition tutor account is ready",
    text: [
      `Hi ${name},`,
      "",
      "Your tutor dashboard account has been created.",
      "You can sign in here: https://simpletuition.com.au/tutor/login",
      "",
      "If you did not request this, please reply to this email.",
      "",
      "Simple Tuition",
    ].join("\n"),
    html: [
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65; max-width: 640px; margin: 0 auto; padding: 24px 20px; background-color: #f5f5f7;">',
      '<div style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden;">',
      '<img src="https://simpletuition.com.au/images/email-banner-centred.png" alt="Simple Tuition" style="display: block; width: 100%; height: auto;" />',
      '<div style="padding: 28px 24px 24px;">',
      `<p style="font-size: 18px; margin: 0 0 18px; font-weight: 600; color: #0f172a;">Hi ${name},</p>`,
      '<p style="font-size: 15px; margin: 0 0 10px; color: #334155;">Your tutor dashboard account has been created.</p>',
      '<p style="font-size: 15px; margin: 0 0 22px; color: #475569;">You can sign in here: <a href="https://simpletuition.com.au/tutor/login" style="color: #2563eb; text-decoration: underline;">simpletuition.com.au/tutor/login</a></p>',
      '<p style="font-size: 14px; margin: 0 0 24px; color: #64748b;">If you did not request this, please reply to this email.</p>',
      '<div style="padding-top: 20px; border-top: 1px solid #e2e8f0;">',
      '<p style="font-size: 13px; margin: 0; color: #94a3b8; font-weight: 500;">Simple Tuition</p>',
      "</div>",
      "</div>",
      "</div>",
      "</div>",
    ].join(""),
  });

  return NextResponse.json({ success: true });
}
