import { NextResponse } from "next/server";
import { convex } from "../../../../lib/convexServer";
import { api } from "../../../../convex/_generated/api";
import { signAuthToken, type AuthRole, type AuthSession } from "../../../../lib/auth";

const COOKIE_NAME = "auth_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(req: Request) {
  let payload: { email?: string; password?: string; role?: AuthRole } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  if (!payload?.email || !payload.password || !payload.role) {
    return NextResponse.json(
      { error: "Email, password, and role are required." },
      { status: 400 }
    );
  }

  const { email, password, role } = payload;
  let result:
    | { success: true; tutorId: string; name: string; email: string }
    | { success: true; adminId: string; name: string; email: string }
    | { success: false; error: string };

  if (role === "admin") {
    result = await convex.mutation(api.auth.loginAdmin, { email, password });
  } else if (role === "tutor") {
    result = await convex.mutation(api.auth.loginTutor, { email, password });
  } else {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Invalid email or password." },
      { status: 401 }
    );
  }

  const session: AuthSession =
    role === "admin"
      ? {
          type: "admin",
          id: result.adminId,
          name: result.name,
          email: result.email,
        }
      : {
          type: "tutor",
          id: result.tutorId,
          name: result.name,
          email: result.email,
        };

  const token = await signAuthToken(session);
  const response = NextResponse.json(session);
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return response;
}
