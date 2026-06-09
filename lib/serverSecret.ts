import "server-only";

// Shared secret proving a Convex call originates from our own server code
// (API route handlers), not directly from a browser. Must match the value set
// on the Convex deployment: `npx convex env set CONVEX_SERVER_SECRET <value>`.
export function getServerSecret(): string {
  const secret = process.env.CONVEX_SERVER_SECRET;
  if (!secret) {
    throw new Error("CONVEX_SERVER_SECRET is not set.");
  }
  return secret;
}
