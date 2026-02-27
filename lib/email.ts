import nodemailer from "nodemailer";

export function getTransporter() {
  const smtpUser = process.env.POSTMARK_SMTP_USER;
  const smtpPass = process.env.POSTMARK_SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    throw new Error("POSTMARK_SMTP_USER and POSTMARK_SMTP_PASS must be set");
  }
  return nodemailer.createTransport({
    host: "smtp.postmarkapp.com",
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export function getFromEmail(): string {
  const from = process.env.POSTMARK_FROM_EMAIL;
  if (!from) throw new Error("POSTMARK_FROM_EMAIL must be set");
  return from;
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://simpletuition.com.au";
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  firstName: string,
) {
  const transporter = getTransporter();
  const from = getFromEmail();
  const resetUrl = `${getSiteUrl()}/student/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Simple Tuition" <${from}>`,
    to,
    subject: "Reset your Simple Tuition password",
    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset your password.",
      "",
      "Click this link to set a new password (expires in 2 hours):",
      resetUrl,
      "",
      "If you didn't request this, you can safely ignore this email.",
      "",
      "Simple Tuition",
    ].join("\n"),
    html: [
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65; max-width: 640px; margin: 0 auto; padding: 24px 20px; background-color: #f5f5f7;">',
      '<div style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; padding: 28px 24px 24px;">',
      '<div style="margin-bottom: 24px; text-align: center;">',
      '<img src="https://simpletuition.com.au/images/simple-text-black.jpg" alt="Simple Tuition" width="140" style="display: block; margin: 0 auto 8px; height: auto;" />',
      "</div>",
      `<p style="font-size: 18px; margin: 0 0 18px; font-weight: 600; color: #0f172a;">Hi ${firstName},</p>`,
      '<p style="font-size: 15px; margin: 0 0 10px; color: #334155;">We received a request to reset your password.</p>',
      '<p style="font-size: 15px; margin: 0 0 22px; color: #475569;">Click the button below to set a new password. This link expires in <strong>2 hours</strong>.</p>',
      '<div style="text-align: center; margin: 0 0 24px;">',
      `<a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 12px;">Reset Password</a>`,
      "</div>",
      '<p style="font-size: 14px; margin: 0 0 24px; color: #64748b;">If you didn\'t request this, you can safely ignore this email.</p>',
      '<div style="padding-top: 20px; border-top: 1px solid #e2e8f0;">',
      '<p style="font-size: 13px; margin: 0; color: #94a3b8; font-weight: 500;">Simple Tuition</p>',
      "</div>",
      "</div>",
      "</div>",
    ].join(""),
  });
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  firstName: string,
) {
  const transporter = getTransporter();
  const from = getFromEmail();
  const verifyUrl = `${getSiteUrl()}/student/verify?token=${token}`;

  await transporter.sendMail({
    from: `"Simple Tuition" <${from}>`,
    to,
    subject: "Activate your Simple Tuition student account",
    text: [
      `Hi ${firstName},`,
      "",
      "Thanks for creating your Simple Tuition account!",
      "",
      "Click this link to verify your email and activate your account:",
      verifyUrl,
      "",
      "This link expires in 24 hours.",
      "",
      "If you didn't create this account, you can safely ignore this email.",
      "",
      "Simple Tuition",
    ].join("\n"),
    html: [
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65; max-width: 640px; margin: 0 auto; padding: 24px 20px; background-color: #f5f5f7;">',
      '<div style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; padding: 28px 24px 24px;">',
      '<div style="margin-bottom: 24px; text-align: center;">',
      '<img src="https://simpletuition.com.au/images/simple-text-black.jpg" alt="Simple Tuition" width="140" style="display: block; margin: 0 auto 8px; height: auto;" />',
      "</div>",
      `<p style="font-size: 18px; margin: 0 0 18px; font-weight: 600; color: #0f172a;">Hi ${firstName},</p>`,
      '<p style="font-size: 15px; margin: 0 0 10px; color: #334155;">Thanks for creating your <strong>Simple Tuition</strong> account!</p>',
      '<p style="font-size: 15px; margin: 0 0 22px; color: #475569;">Click the button below to verify your email and activate your account. This link expires in <strong>24 hours</strong>.</p>',
      '<div style="text-align: center; margin: 0 0 24px;">',
      `<a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 12px;">Verify Email</a>`,
      "</div>",
      '<p style="font-size: 14px; margin: 0 0 24px; color: #64748b;">If you didn\'t create this account, you can safely ignore this email.</p>',
      '<div style="padding-top: 20px; border-top: 1px solid #e2e8f0;">',
      '<p style="font-size: 13px; margin: 0; color: #94a3b8; font-weight: 500;">Simple Tuition</p>',
      "</div>",
      "</div>",
      "</div>",
    ].join(""),
  });
}
