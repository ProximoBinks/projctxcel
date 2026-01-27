import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { api } from "../../../convex/_generated/api";
import { convex } from "../../../lib/convexServer";

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  yearLevel?: string;
  subjects?: string;
  message?: string;
  company?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const { name, email, phone, yearLevel, subjects, message, company } = body;

  if (!name || !email || !yearLevel || !message) {
    return NextResponse.json(
      { message: "Name, email, year level, and message are required." },
      { status: 400 }
    );
  }

  if (company) {
    return NextResponse.json({ message: "Enquiry received." });
  }

  await convex.mutation(api.enquiries.create, {
    name,
    email,
    phone: phone || undefined,
    yearLevel,
    subjects: subjects ?? "",
    message,
  });

  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.POSTMARK_FROM_EMAIL;
  const smtpUser = process.env.POSTMARK_SMTP_USER;
  const smtpPass = process.env.POSTMARK_SMTP_PASS;

  if (!toEmail || !fromEmail || !smtpUser || !smtpPass) {
    return NextResponse.json({ message: "Enquiry stored." });
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

  const adminLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `Year level: ${yearLevel}`,
    `Subjects: ${subjects || "Not provided"}`,
    "",
    "Message:",
    message,
  ];

  await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    subject: `New projctxcel enquiry - ${name}`,
    text: adminLines.join("\n"),
  });

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: "Thanks for your enquiry",
    text:
      "Thanks for reaching out to projctxcel. We have received your enquiry and will be in touch shortly.",
  });

  return NextResponse.json({ message: "Enquiry sent successfully." });
}
