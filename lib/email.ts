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
      "We received a request to reset your Simple Tuition student account password.",
      "",
      "Click the link below to set a new password. This link expires in 2 hours.",
      "",
      resetUrl,
      "",
      "If the link above doesn't work, copy and paste it into your browser's address bar.",
      "",
      "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
      "",
      "Need help? Reply to this email or contact us at admin@simpletuition.com.au",
      "",
      "Simple Tuition",
      "Adelaide, South Australia",
      "https://simpletuition.com.au",
    ].join("\n"),
    html: [
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65; max-width: 600px; margin: 0 auto; padding: 32px 16px; background-color: #f5f5f7;">',
      '<div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden;">',
      '<img src="https://simpletuition.com.au/images/email-banner-centred.png" alt="Simple Tuition" width="600" style="display: block; width: 100%; height: auto; border: 0;" />',
      '<div style="padding: 36px 40px 32px;">',
      `<p style="font-size: 18px; margin: 0 0 6px; font-weight: 700; color: #0f172a;">Hi ${firstName},</p>`,
      '<p style="font-size: 15px; margin: 0 0 20px; color: #475569;">We received a request to reset your Simple Tuition student account password.</p>',
      '<p style="font-size: 15px; margin: 0 0 8px; color: #334155;">Click the button below to choose a new password. For your security, this link will expire in <strong style="color: #0f172a;">2 hours</strong>.</p>',
      '<p style="font-size: 15px; margin: 0 0 28px; color: #475569;">If you didn\'t make this request, no action is needed — your password will not be changed.</p>',
      '<div style="text-align: center; margin: 0 0 28px;">',
      `<a href="${resetUrl}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 10px; letter-spacing: -0.1px;">Reset Password</a>`,
      "</div>",
      '<div style="background-color: #f8fafc; border-radius: 10px; padding: 16px 20px; margin: 0 0 24px;">',
      '<p style="font-size: 13px; margin: 0 0 6px; color: #64748b;">If the button above doesn\'t work, copy and paste this link into your browser:</p>',
      `<p style="font-size: 13px; margin: 0; word-break: break-all;"><a href="${resetUrl}" style="color: #1d4ed8; text-decoration: underline;">${resetUrl}</a></p>`,
      "</div>",
      '<p style="font-size: 14px; margin: 0; color: #64748b;">Questions? Reply to this email or contact us at <a href="mailto:admin@simpletuition.com.au" style="color: #1d4ed8; text-decoration: none;">admin@simpletuition.com.au</a></p>',
      "</div>",
      '<div style="padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center;">',
      '<p style="font-size: 12px; margin: 0 0 4px; color: #94a3b8;">Simple Tuition &middot; Adelaide, South Australia</p>',
      '<p style="font-size: 12px; margin: 0; color: #94a3b8;"><a href="https://simpletuition.com.au" style="color: #94a3b8; text-decoration: none;">simpletuition.com.au</a> &middot; <a href="mailto:admin@simpletuition.com.au" style="color: #94a3b8; text-decoration: none;">admin@simpletuition.com.au</a></p>',
      "</div>",
      "</div>",
      "</div>",
    ].join(""),
  });
}

export async function sendTutorPasswordResetEmail(
  to: string,
  token: string,
  firstName: string,
) {
  const transporter = getTransporter();
  const from = getFromEmail();
  const resetUrl = `${getSiteUrl()}/tutor/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Simple Tuition" <${from}>`,
    to,
    subject: "Reset your Simple Tuition tutor password",
    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset your Simple Tuition tutor dashboard password.",
      "",
      "Click the link below to set a new password. This link expires in 2 hours.",
      "",
      resetUrl,
      "",
      "If the link above doesn't work, copy and paste it into your browser's address bar.",
      "",
      "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
      "",
      "Need help? Reply to this email or contact us at admin@simpletuition.com.au",
      "",
      "Simple Tuition",
      "Adelaide, South Australia",
      "https://simpletuition.com.au",
    ].join("\n"),
    html: [
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65; max-width: 600px; margin: 0 auto; padding: 32px 16px; background-color: #f5f5f7;">',
      '<div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden;">',
      '<img src="https://simpletuition.com.au/images/email-banner-centred.png" alt="Simple Tuition" width="600" style="display: block; width: 100%; height: auto; border: 0;" />',
      '<div style="padding: 36px 40px 32px;">',
      `<p style="font-size: 18px; margin: 0 0 6px; font-weight: 700; color: #0f172a;">Hi ${firstName},</p>`,
      '<p style="font-size: 15px; margin: 0 0 20px; color: #475569;">We received a request to reset your Simple Tuition tutor dashboard password.</p>',
      '<p style="font-size: 15px; margin: 0 0 8px; color: #334155;">Click the button below to choose a new password. For your security, this link will expire in <strong style="color: #0f172a;">2 hours</strong>.</p>',
      '<p style="font-size: 15px; margin: 0 0 28px; color: #475569;">If you didn\'t make this request, no action is needed — your password will not be changed.</p>',
      '<div style="text-align: center; margin: 0 0 28px;">',
      `<a href="${resetUrl}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 10px; letter-spacing: -0.1px;">Reset Password</a>`,
      "</div>",
      '<div style="background-color: #f8fafc; border-radius: 10px; padding: 16px 20px; margin: 0 0 24px;">',
      '<p style="font-size: 13px; margin: 0 0 6px; color: #64748b;">If the button above doesn\'t work, copy and paste this link into your browser:</p>',
      `<p style="font-size: 13px; margin: 0; word-break: break-all;"><a href="${resetUrl}" style="color: #1d4ed8; text-decoration: underline;">${resetUrl}</a></p>`,
      "</div>",
      '<p style="font-size: 14px; margin: 0; color: #64748b;">Questions? Reply to this email or contact us at <a href="mailto:admin@simpletuition.com.au" style="color: #1d4ed8; text-decoration: none;">admin@simpletuition.com.au</a></p>',
      "</div>",
      '<div style="padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center;">',
      '<p style="font-size: 12px; margin: 0 0 4px; color: #94a3b8;">Simple Tuition &middot; Adelaide, South Australia</p>',
      '<p style="font-size: 12px; margin: 0; color: #94a3b8;"><a href="https://simpletuition.com.au" style="color: #94a3b8; text-decoration: none;">simpletuition.com.au</a> &middot; <a href="mailto:admin@simpletuition.com.au" style="color: #94a3b8; text-decoration: none;">admin@simpletuition.com.au</a></p>',
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
      "Thanks for signing up with Simple Tuition — Adelaide's top 1% ATAR tutors for Year 4–12 students.",
      "",
      "Please verify your email address to activate your student account.",
      "Click the link below (expires in 24 hours):",
      "",
      verifyUrl,
      "",
      "If the link above doesn't work, copy and paste it into your browser's address bar.",
      "",
      "Once verified, you'll be able to:",
      "- View your upcoming session timetable",
      "- Access notes and resources shared by your tutor",
      "- Track your progress throughout the year",
      "",
      "If you didn't create this account, you can safely ignore this email.",
      "",
      "Questions? Reply to this email or contact us at admin@simpletuition.com.au",
      "",
      "Simple Tuition",
      "Adelaide, South Australia",
      "https://simpletuition.com.au",
    ].join("\n"),
    html: [
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65; max-width: 600px; margin: 0 auto; padding: 32px 16px; background-color: #f5f5f7;">',
      '<div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden;">',
      '<img src="https://simpletuition.com.au/images/email-banner-centred.png" alt="Simple Tuition — Top 1% ATAR Tutors in Adelaide" width="600" style="display: block; width: 100%; height: auto; border: 0;" />',
      '<div style="padding: 36px 40px 32px;">',
      `<p style="font-size: 18px; margin: 0 0 6px; font-weight: 700; color: #0f172a;">Hi ${firstName},</p>`,
      '<p style="font-size: 15px; margin: 0 0 8px; color: #334155;">Thanks for signing up with <strong>Simple Tuition</strong>. We\'re excited to have you on board.</p>',
      '<p style="font-size: 15px; margin: 0 0 24px; color: #475569;">Please verify your email address to activate your student account. This link expires in <strong style="color: #0f172a;">24 hours</strong>.</p>',
      '<div style="text-align: center; margin: 0 0 28px;">',
      `<a href="${verifyUrl}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 10px; letter-spacing: -0.1px;">Verify Email Address</a>`,
      "</div>",
      '<div style="background-color: #f8fafc; border-radius: 10px; padding: 16px 20px; margin: 0 0 28px;">',
      '<p style="font-size: 13px; margin: 0 0 6px; color: #64748b;">If the button above doesn\'t work, copy and paste this link into your browser:</p>',
      `<p style="font-size: 13px; margin: 0; word-break: break-all;"><a href="${verifyUrl}" style="color: #1d4ed8; text-decoration: underline;">${verifyUrl}</a></p>`,
      "</div>",
      '<p style="font-size: 14px; margin: 0 0 16px; font-weight: 600; color: #0f172a;">Once verified, your account gives you access to:</p>',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">',
      '<tr><td width="20" valign="top" style="padding-top: 2px; font-size: 14px; color: #1d4ed8;">&#10003;</td><td style="font-size: 14px; color: #475569; line-height: 1.6; padding-bottom: 8px;"><strong style="color: #334155;">Your session timetable</strong> — see upcoming bookings at a glance</td></tr>',
      '<tr><td width="20" valign="top" style="padding-top: 2px; font-size: 14px; color: #1d4ed8;">&#10003;</td><td style="font-size: 14px; color: #475569; line-height: 1.6; padding-bottom: 8px;"><strong style="color: #334155;">Notes &amp; resources</strong> — materials shared by your tutor</td></tr>',
      '<tr><td width="20" valign="top" style="padding-top: 2px; font-size: 14px; color: #1d4ed8;">&#10003;</td><td style="font-size: 14px; color: #475569; line-height: 1.6;"><strong style="color: #334155;">Progress tracking</strong> — stay on top of your goals throughout the year</td></tr>',
      "</table>",
      '<p style="font-size: 14px; margin: 24px 0 0; color: #64748b;">Didn\'t create this account? You can safely ignore this email. Questions? Contact us at <a href="mailto:admin@simpletuition.com.au" style="color: #1d4ed8; text-decoration: none;">admin@simpletuition.com.au</a></p>',
      "</div>",
      '<div style="padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center;">',
      '<p style="font-size: 12px; margin: 0 0 4px; color: #94a3b8;">Simple Tuition &middot; Adelaide, South Australia</p>',
      '<p style="font-size: 12px; margin: 0; color: #94a3b8;"><a href="https://simpletuition.com.au" style="color: #94a3b8; text-decoration: none;">simpletuition.com.au</a> &middot; <a href="mailto:admin@simpletuition.com.au" style="color: #94a3b8; text-decoration: none;">admin@simpletuition.com.au</a></p>',
      "</div>",
      "</div>",
      "</div>",
    ].join(""),
  });
}
