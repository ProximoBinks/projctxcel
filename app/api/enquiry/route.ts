import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { api } from "../../../convex/_generated/api";
import { convex } from "../../../lib/convexServer";

export const runtime = "nodejs";

const fileSizeLimit = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const type = String(formData.get("type") ?? "");
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const yearLevel = String(formData.get("yearLevel") ?? "");
  const subjects = String(formData.get("subjects") ?? "");
  const message = String(formData.get("message") ?? "");
  const targetAtar = String(formData.get("targetAtar") ?? "");
  const plannedCourse = String(formData.get("plannedCourse") ?? "");
  const interests = String(formData.get("interests") ?? "");
  const experience = String(formData.get("experience") ?? "");
  const expertise = String(formData.get("expertise") ?? "");
  const consent = String(formData.get("consent") ?? "") === "true";
  const sourcePage = String(formData.get("sourcePage") ?? "");
  const utmRaw = String(formData.get("utm") ?? "");
  const company = String(formData.get("company") ?? "");
  const cvFile = formData.get("cv");

  if (!type || !name || !email || !phone || !consent) {
    return NextResponse.json(
      { message: "Missing required contact fields." },
      { status: 400 }
    );
  }

  if (type !== "student" && type !== "tutor" && type !== "general") {
    return NextResponse.json(
      { message: "Invalid enquiry type." },
      { status: 400 }
    );
  }

  if (company) {
    return NextResponse.json({ message: "Enquiry received." });
  }

  if (type === "student") {
    if (!yearLevel || !subjects || !interests) {
      return NextResponse.json(
        { message: "Missing required student fields." },
        { status: 400 }
      );
    }
  }

  if (type === "tutor") {
    if (!experience || !expertise) {
      return NextResponse.json(
        { message: "Missing required tutor fields." },
        { status: 400 }
      );
    }
  }

  let utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  } | undefined;
  if (utmRaw) {
    try {
      utm = JSON.parse(utmRaw) as typeof utm;
    } catch {
      utm = undefined;
    }
  }

  let cvFileName: string | undefined;
  let cvFileType: string | undefined;
  let cvFileSize: number | undefined;
  let cvAttachment:
    | { filename: string; content: Buffer; contentType?: string }
    | undefined;

  if (cvFile && cvFile instanceof File) {
    if (cvFile.size > fileSizeLimit) {
      return NextResponse.json(
        { message: "CV file is too large (max 5MB)." },
        { status: 400 }
      );
    }
    const fileNameLower = cvFile.name.toLowerCase();
    const allowedExtensions = [".pdf", ".docx"];
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      fileNameLower.endsWith(ext)
    );
    if (!hasAllowedExtension) {
      return NextResponse.json(
        { message: "CV must be a PDF or DOCX file." },
        { status: 400 }
      );
    }
    cvFileName = cvFile.name;
    cvFileType = cvFile.type;
    cvFileSize = cvFile.size;
    const arrayBuffer = await cvFile.arrayBuffer();
    cvAttachment = {
      filename: cvFile.name,
      content: Buffer.from(arrayBuffer),
      contentType: cvFile.type || undefined,
    };
  }

  await convex.mutation(api.enquiries.create, {
    type,
    name,
    email,
    phone,
    yearLevel,
    subjects,
    message,
    targetAtar: targetAtar || undefined,
    plannedCourse: plannedCourse || undefined,
    interests: interests || undefined,
    experience: experience || undefined,
    expertise: expertise || undefined,
    cvFileName,
    cvFileType,
    cvFileSize,
    consent,
    sourcePage: sourcePage || undefined,
    utm,
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

  const baseLines = [
    `Type: ${type}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    "",
  ];

  const studentLines = [
    `Year level: ${yearLevel || "Not provided"}`,
    `Target ATAR: ${targetAtar || "Not provided"}`,
    `Subjects: ${subjects || "Not provided"}`,
    `Planned course: ${plannedCourse || "Not provided"}`,
    `Interests: ${interests || "Not provided"}`,
  ];

  const tutorLines = [
    `Experience: ${experience || "Not provided"}`,
    `Expertise: ${expertise || "Not provided"}`,
    `CV: ${cvFileName || "Not provided"}`,
  ];

  const generalLines = ["General enquiry"];

  const adminLines = [
    ...baseLines,
    ...(type === "student"
      ? studentLines
      : type === "tutor"
      ? tutorLines
      : generalLines),
    "",
    "Message:",
    message,
  ];

  await transporter.sendMail({
    from: `"Simple Tuition" <${fromEmail}>`,
    to: toEmail,
    subject: `New Simple Tuition enquiry - ${name}`,
    text: adminLines.join("\n"),
    attachments: type === "tutor" && cvAttachment ? [cvAttachment] : [],
  });

  await transporter.sendMail({
    from: `"Simple Tuition" <${fromEmail}>`,
    to: email,
    subject: "Thanks for your enquiry",
    text:
      "Thanks for reaching out to Simple Tuition. We have received your enquiry and will be in touch shortly.",
  });

  return NextResponse.json({ message: "Enquiry sent successfully." });
}
