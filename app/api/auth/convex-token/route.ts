import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "../../../../lib/auth";
import { mintConvexToken } from "../../../../lib/convexAuthKeys";

export const runtime = "nodejs";

const COOKIE_NAME = "auth_token";

// Exchanges the httpOnly session cookie for a short-lived RS256 token that the
// Convex client attaches to its websocket. The session cookie stays httpOnly;
// only this derived token is exposed to client JS.
export async function GET() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyAuthToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convexToken = await mintConvexToken(session);
  return NextResponse.json(
    { token: convexToken },
    { headers: { "Cache-Control": "no-store" } },
  );
}
