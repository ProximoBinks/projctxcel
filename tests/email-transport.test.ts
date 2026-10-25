import { afterEach, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import { sendPasswordResetEmail, sendTutorPasswordResetEmail, sendVerificationEmail } from "../lib/email";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it("renders the existing account emails with the upgraded mailer without network delivery", async () => {
  vi.stubEnv("POSTMARK_SMTP_USER", "fixture");
  vi.stubEnv("POSTMARK_SMTP_PASS", "fixture");
  vi.stubEnv("POSTMARK_FROM_EMAIL", "admin@example.com");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const send = vi.spyOn(transport, "sendMail");
  vi.spyOn(nodemailer, "createTransport").mockReturnValue(transport);
  await sendPasswordResetEmail("student@example.com", "test-token", "Alex");
  await sendTutorPasswordResetEmail("tutor@example.com", "test-token", "Alex");
  await sendVerificationEmail("student@example.com", "test-token", "Alex");
  expect(send).toHaveBeenCalledTimes(3);
  for (const result of send.mock.results) {
    const message = await result.value;
    expect(message.message.toString()).toContain("multipart/alternative");
    expect(message.envelope.to).toHaveLength(1);
  }
});
