import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { convex } from "../../../../lib/convexServer";
import { api } from "../../../../convex/_generated/api";
import { sendVerificationEmail } from "../../../../lib/email";
import { getServerSecret } from "../../../../lib/serverSecret";
import { rateLimit, tooManyRequests } from "../../../../lib/rateLimit";

export const runtime = "nodejs";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// POST { token } -> verify email
// POST { email } -> resend verification email
export async function POST(req: Request) {
  const rl = await rateLimit(req, "verify-email", { maxAttempts: 8, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Verify token
  if (typeof body.token === "string") {
    const tokenHash = hashToken(body.token);
    const result = await convex.mutation(api.studentDashboard.verifyEmail, {
      tokenHash,
      serverSecret: getServerSecret(),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  }

  // Resend verification email
  if (typeof body.email === "string" && body.email.trim()) {
    const email = body.email.toLowerCase().trim();
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const result = await convex.mutation(
      api.studentDashboard.createEmailVerificationToken,
      { email, tokenHash, serverSecret: getServerSecret() },
    );

    if (result.created && result.name) {
      const firstName = result.name.trim().split(/\s+/)[0] || "there";
      try {
        await sendVerificationEmail(email, rawToken, firstName);
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
    }

    return NextResponse.json({
      message: "If an account exists with that email, a verification link has been sent.",
    });
  }

  return NextResponse.json({ error: "Token or email is required." }, { status: 400 });
}
