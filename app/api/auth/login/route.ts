import { NextResponse } from "next/server";
import { convex } from "../../../../lib/convexServer";
import { api } from "../../../../convex/_generated/api";
import { signAuthToken, type AuthRole, type AuthSession } from "../../../../lib/auth";
import type { Id } from "../../../../convex/_generated/dataModel";

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
  if (role === "admin") {
    const adminResult = await convex.mutation(api.auth.loginAdmin, {
      email,
      password,
    });
    if (!adminResult.success) {
      return NextResponse.json(
        { error: adminResult.error || "Invalid email or password." },
        { status: 401 }
      );
    }

    const session: AuthSession = {
      type: "admin",
      id: adminResult.adminId,
      name: adminResult.name,
      email: adminResult.email,
      roles: adminResult.roles,
    };
    const token = await signAuthToken(session);
    const response = NextResponse.json(session);
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  }

  if (role === "tutor") {
    const tutorResult = await convex.mutation(api.auth.loginTutor, {
      email,
      password,
    });
    if (!tutorResult.success) {
      return NextResponse.json(
        { error: tutorResult.error || "Invalid email or password." },
        { status: 401 }
      );
    }

    const session: AuthSession = {
      type: "tutor",
      id: tutorResult.tutorId,
      name: tutorResult.name,
      email: tutorResult.email,
      roles: tutorResult.roles,
    };
    const token = await signAuthToken(session);
    const response = NextResponse.json(session);
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  }

  if (role === "student") {
    const studentResult = await convex.mutation(api.studentDashboard.login, {
      email,
      password,
    });
    if (!studentResult.success) {
      return NextResponse.json(
        { error: studentResult.error || "Invalid email or password." },
        { status: 401 }
      );
    }

    const session: AuthSession = {
      type: "student",
      id: studentResult.studentAccountId as string,
      name: studentResult.name || "",
      email,
      roles: ["student"],
      studentId: studentResult.studentId as string,
    };
    const token = await signAuthToken(session);
    const response = NextResponse.json(session);
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  }

  return NextResponse.json({ error: "Invalid role." }, { status: 400 });
}
