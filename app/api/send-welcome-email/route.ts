import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "../../../lib/auth";

// Retired: all sends now use the authenticated admin composer.
export async function POST() {
  const token = (await cookies()).get("auth_token")?.value;
  const session = token ? await verifyAuthToken(token) : null;
  if (session?.type !== "admin" || !session.roles.includes("admin")) return NextResponse.json({ message: "Admin sign-in required." }, { status: 401 });
  return NextResponse.json({ message: "Please refresh the admin page and use the email composer." }, { status: 410 });
}
