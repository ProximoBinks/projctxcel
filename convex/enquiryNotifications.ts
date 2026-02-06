"use node";

import nodemailer from "nodemailer";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendNotification = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    yearLevel: v.string(),
    subjects: v.string(),
    message: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    skipped: v.optional(v.boolean()),
  }),
  handler: async (_ctx, args) => {
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail =
      process.env.POSTMARK_FROM_EMAIL || "admin@simpletuition.com.au";
    const smtpUser = process.env.POSTMARK_SMTP_USER;
    const smtpPass = process.env.POSTMARK_SMTP_PASS;

    if (!toEmail || !smtpUser || !smtpPass) {
      console.warn("Postmark SMTP skipped: missing env vars", {
        hasToEmail: !!toEmail,
        hasFromEmail: !!fromEmail,
        hasSmtpUser: !!smtpUser,
        hasSmtpPass: !!smtpPass,
      });
      return { ok: false, skipped: true };
    }

    const lines = [
      `Name: ${args.name}`,
      `Email: ${args.email}`,
      `Phone: ${args.phone || "Not provided"}`,
      `Year level: ${args.yearLevel}`,
      `Subjects: ${args.subjects}`,
      "",
      "Message:",
      args.message,
    ];

    const transporter = nodemailer.createTransport({
      host: "smtp.postmarkapp.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
      subject: `New Simple Tuition enquiry - ${args.name}`,
        text: lines.join("\n"),
      });
      console.log("Postmark SMTP sent", {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });
    } catch (error) {
      console.error("Postmark SMTP error", error);
      throw error;
    }

    return { ok: true };
  },
});
