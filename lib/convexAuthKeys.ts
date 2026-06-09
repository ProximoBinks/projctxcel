import "server-only";
import {
  importPKCS8,
  exportJWK,
  calculateJwkThumbprint,
  SignJWT,
  type JWK,
} from "jose";
import type { AuthSession } from "./auth";

// Issuer/audience for the RS256 tokens Convex validates. `CONVEX_ISSUER` MUST
// exactly match `domain` in convex/auth.config.ts and be the origin that serves
// /.well-known/openid-configuration. `CONVEX_AUDIENCE` matches `applicationID`.
export const CONVEX_ISSUER = "https://simpletuition.com.au";
export const CONVEX_AUDIENCE = "convex";
const ALG = "RS256";

type Loaded = { signingKey: CryptoKey; kid: string; publicJwk: JWK };
let cached: Loaded | null = null;

async function load(): Promise<Loaded> {
  if (cached) return cached;
  const b64 = process.env.CONVEX_AUTH_PRIVATE_KEY;
  if (!b64) throw new Error("CONVEX_AUTH_PRIVATE_KEY is not set.");
  const pkcs8 = Buffer.from(b64, "base64").toString("utf8");
  const signingKey = (await importPKCS8(pkcs8, ALG, {
    extractable: true,
  })) as CryptoKey;

  // Derive the PUBLIC JWK (RSA: only kty/n/e) — never expose private fields.
  const full = await exportJWK(signingKey);
  const publicJwk: JWK = { kty: full.kty!, n: full.n, e: full.e };
  const kid = await calculateJwkThumbprint(publicJwk);
  publicJwk.kid = kid;
  publicJwk.alg = ALG;
  publicJwk.use = "sig";

  cached = { signingKey, kid, publicJwk };
  return cached;
}

/** Public JWK Set served at /.well-known/jwks.json. */
export async function getPublicJwks(): Promise<{ keys: JWK[] }> {
  const { publicJwk } = await load();
  return { keys: [publicJwk] };
}

/**
 * Mint a short-lived RS256 token Convex can verify. Carries the EXISTING
 * account IDs as claims so every Convex function resolves to the same records
 * (no data migration): admins/tutors -> tutorAccountId, students -> studentId.
 */
export async function mintConvexToken(session: AuthSession): Promise<string> {
  const { signingKey, kid } = await load();

  const claims: Record<string, unknown> = {
    type: session.type,
    roles: session.roles,
  };
  if (session.type === "student") {
    claims.studentId = session.studentId;
    claims.studentAccountId = session.id;
  } else {
    // admin or tutor: session.id is the tutorAccounts document id
    claims.tutorAccountId = session.id;
  }

  return new SignJWT(claims)
    .setProtectedHeader({ alg: ALG, kid })
    .setIssuer(CONVEX_ISSUER)
    .setAudience(CONVEX_AUDIENCE)
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(signingKey);
}
