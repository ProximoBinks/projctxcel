import { NextResponse } from "next/server";
import { CONVEX_ISSUER } from "../../../../lib/convexAuthKeys";

export const runtime = "nodejs";

// Served at /.well-known/openid-configuration via a rewrite in next.config.js.
// Convex reads this discovery document to locate the JWKS endpoint.
export async function GET() {
  return NextResponse.json(
    {
      issuer: CONVEX_ISSUER,
      jwks_uri: `${CONVEX_ISSUER}/.well-known/jwks.json`,
      id_token_signing_alg_values_supported: ["RS256"],
      response_types_supported: ["id_token"],
      subject_types_supported: ["public"],
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
