import { NextResponse } from "next/server";
import { api } from "../../../convex/_generated/api";
import { convex } from "../../../lib/convexServer";
import { getTransporter, getFromEmail } from "../../../lib/email";

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
  let fromEmail: string;
  let transporter: ReturnType<typeof getTransporter>;
  try {
    fromEmail = getFromEmail();
    transporter = getTransporter();
  } catch {
    return NextResponse.json({ message: "Enquiry stored." });
  }
  if (!toEmail) {
    return NextResponse.json({ message: "Enquiry stored." });
  }

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
    replyTo: `"${name}" <${email}>`,
    subject: `New Simple Tuition enquiry - ${name}`,
    text: adminLines.join("\n"),
    attachments: type === "tutor" && cvAttachment ? [cvAttachment] : [],
  });

  const rawFirst =
    name.trim().split(/\s+/)[0] || name.trim() || "there";
  const firstName =
    rawFirst === "there"
      ? rawFirst
      : rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();

  const replySubject =
    type === "tutor"
      ? "Thanks for your application"
      : type === "general"
      ? "Thanks for your enquiry"
      : "Thanks for your enquiry";

  const replyHeadline =
    type === "tutor"
      ? "Thanks for your interest in joining Simple Tuition."
      : "Thanks for reaching out to Simple Tuition.";

  const replyNextStepsTitle =
    type === "tutor"
      ? "What happens next"
      : type === "general"
      ? "Next steps"
      : "What happens next";

  const replyNextSteps =
    type === "tutor"
      ? [
          "Our team will review your application.",
          "If your experience aligns with our needs, we will contact you to arrange next steps.",
        ]
      : type === "general"
      ? [
          "We will review your message and respond within 1 business day.",
          "If any extra details are needed, we will follow up by email.",
        ]
      : [
          "We review your details and match you with a suitable tutor.",
          "We contact you to confirm availability and next steps.",
        ];

  const replyIntroLine =
    type === "tutor"
      ? "We have received your application and will be in touch within 1 business day."
      : "We have received your enquiry and will be in touch within 1 business day.";

  await transporter.sendMail({
    from: `"Simple Tuition" <${fromEmail}>`,
    to: email,
    subject: replySubject,
    text: [
      `Hi ${firstName},`,
      "",
      replyHeadline,
      "",
      replyIntroLine,
      "",
      `${replyNextStepsTitle}:`,
      ...replyNextSteps.map((step) => `- ${step}`),
      "",
      "If you need to add or update any details, reply to this email.",
      "",
      "Simple Tuition",
    ].join("\n"),
    html: [
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.65; max-width: 640px; margin: 0 auto; padding: 24px 20px; background-color: #f5f5f7;">',
      '<div style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; padding: 28px 24px 24px;">',
      '<div style="margin-bottom: 24px; text-align: center;">',
      '<img src="https://simpletuition.com.au/images/simple-text-black.jpg" alt="Simple Tuition" width="140" style="display: block; margin: 0 auto 8px; height: auto;" />',
      '<div style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af;">Simple Tuition</div>',
      "</div>",
      `<p style="font-size: 18px; margin: 0 0 18px; font-weight: 600; color: #0f172a;">Hi ${firstName},</p>`,
      `<p style="font-size: 16px; margin: 0 0 10px; color: #334155;">${replyHeadline.replace(
        "Simple Tuition",
        '<strong style=\'color: #0f172a;\'>Simple Tuition</strong>'
      )}</p>`,
      `<p style="font-size: 15px; margin: 0 0 22px; color: #475569;">${replyIntroLine.replace(
        "1 business day",
        '<strong style=\'color: #1e293b;\'>1 business day</strong>'
      )}</p>`,
      '<div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 20px 16px; margin: 0 0 24px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);">',
      `<p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #0f172a; letter-spacing: 0.01em;">${replyNextStepsTitle}</p>`,
      '<ul style="padding-left: 20px; margin: 0; font-size: 15px; color: #0f172a; line-height: 1.7;">',
      ...replyNextSteps.map(
        (step) =>
          `<li style="margin-bottom: 6px;">${step}</li>`
      ),
      "</ul>",
      "</div>",
      '<p style="font-size: 14px; margin: 0 0 24px; color: #64748b;">If you need to add or update any details, simply reply to this email.</p>',
      '<div style="padding-top: 20px; border-top: 1px solid #e2e8f0;">',
      '<p style="font-size: 13px; margin: 0; color: #94a3b8; font-weight: 500;">Simple Tuition</p>',
      "</div>",
      "</div>",
      "</div>",
    ].join(""),
  });

  return NextResponse.json({ message: "Enquiry sent successfully." });
}
