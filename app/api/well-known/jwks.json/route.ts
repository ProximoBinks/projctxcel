import { NextResponse } from "next/server";
import { getPublicJwks } from "../../../../lib/convexAuthKeys";

export const runtime = "nodejs";

// Served at /.well-known/jwks.json via a rewrite in next.config.js.
// Convex fetches this to verify the RS256 tokens minted by /api/auth/convex-token.
export async function GET() {
  const jwks = await getPublicJwks();
  return NextResponse.json(jwks, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
