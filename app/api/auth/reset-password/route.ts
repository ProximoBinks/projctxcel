import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { convex } from "../../../../lib/convexServer";
import { api } from "../../../../convex/_generated/api";
import { sendPasswordResetEmail } from "../../../../lib/email";

export const runtime = "nodejs";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// POST: Request a password reset (send email) OR reset the password (with token)
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // If token + newPassword provided -> reset the password
  if (typeof body.token === "string" && typeof body.newPassword === "string") {
    const { token, newPassword } = body;

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const tokenHash = hashToken(token);
    const newPasswordHash = hashPassword(newPassword);

    const result = await convex.mutation(api.studentDashboard.resetPassword, {
      tokenHash,
      newPasswordHash,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  }

  // Otherwise: email provided -> send reset email
  if (typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const result = await convex.mutation(
    api.studentDashboard.createPasswordResetToken,
    { email, tokenHash },
  );

  // Always return success to prevent email enumeration
  if (result.created && result.name) {
    const firstName = result.name.trim().split(/\s+/)[0] || "there";
    try {
      await sendPasswordResetEmail(email, rawToken, firstName);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  return NextResponse.json({
    message: "If an account exists with that email, you will receive a password reset link.",
  });
}
