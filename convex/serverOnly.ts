// Guard for Convex mutations that must only ever be invoked by our own trusted
// server code (Next.js API route handlers), never directly by a browser.
//
// Because the browser talks to Convex directly, every public function is
// reachable by anyone who knows the deployment URL. Unauthenticated flows that
// mint accounts or accept a password-reset token therefore cannot rely on the
// client behaving — they require a shared secret that only the server knows.
//
// Set the same value in BOTH places:
//   - Convex deployment env:  npx convex env set CONVEX_SERVER_SECRET <value>
//   - Next.js/Netlify env:    CONVEX_SERVER_SECRET=<value>   (server-side only)

export function assertServerSecret(provided: string): void {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected) {
    throw new Error(
      "CONVEX_SERVER_SECRET is not set on the Convex deployment. " +
        "Run: npx convex env set CONVEX_SERVER_SECRET <value>",
    );
  }
  if (provided !== expected) {
    throw new Error("Unauthorized: invalid server secret");
  }
}
