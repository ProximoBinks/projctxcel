import { SignJWT, jwtVerify } from "jose";

export type AuthRole = "admin" | "tutor";
export type AuthSession = {
  type: AuthRole;
  id: string;
  name: string;
  email: string;
};

const secret = process.env.AUTH_JWT_SECRET;
if (!secret) {
  throw new Error("AUTH_JWT_SECRET is not set.");
}

const secretKey = new TextEncoder().encode(secret);

export async function signAuthToken(session: AuthSession): Promise<string> {
  return new SignJWT({
    type: session.type,
    name: session.name,
    email: session.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.sub !== "string") return null;
    if (payload.type !== "admin" && payload.type !== "tutor") return null;
    if (typeof payload.name !== "string") return null;
    if (typeof payload.email !== "string") return null;

    return {
      type: payload.type,
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
