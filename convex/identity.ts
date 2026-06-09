// Server-side identity + authorization helpers backed by Convex `ctx.auth`.
//
// The browser attaches an RS256 token (minted by /api/auth/convex-token) to its
// Convex connection; Convex verifies it against our JWKS and exposes the claims
// via ctx.auth.getUserIdentity(). These helpers derive the acting account from
// that verified identity — never from client-supplied arguments — which closes
// the IDOR where anyone could pass another studentId/adminId.

import type { Id } from "./_generated/dataModel";

// Works for queries, mutations, and actions (all expose ctx.auth).
type AuthCtx = { auth: { getUserIdentity: () => Promise<any> } };
type DbCtx = AuthCtx & { db: { get: (id: any) => Promise<any> } };

export class UnauthenticatedError extends Error {
  constructor() {
    super("Unauthenticated");
  }
}
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
  }
}

async function identityOrThrow(ctx: AuthCtx): Promise<any> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new UnauthenticatedError();
  return identity;
}

/** Require an authenticated admin; returns their tutorAccounts id (DB-verified). */
export async function requireAdmin(ctx: DbCtx): Promise<Id<"tutorAccounts">> {
  const identity = await identityOrThrow(ctx);
  const adminId = identity.tutorAccountId as Id<"tutorAccounts"> | undefined;
  if (identity.type !== "admin" || !adminId) throw new ForbiddenError();

  // Defense in depth: confirm the account still holds the admin role.
  const account = await ctx.db.get(adminId);
  if (!account || !account.roles?.includes("admin")) throw new ForbiddenError();
  return adminId;
}

/** Require an authenticated tutor OR admin; returns their tutorAccounts id. */
export async function requireTutor(ctx: DbCtx): Promise<Id<"tutorAccounts">> {
  const identity = await identityOrThrow(ctx);
  const tutorId = identity.tutorAccountId as Id<"tutorAccounts"> | undefined;
  if ((identity.type !== "tutor" && identity.type !== "admin") || !tutorId) {
    throw new ForbiddenError();
  }
  const account = await ctx.db.get(tutorId);
  if (!account) throw new ForbiddenError();
  return tutorId;
}

/** Require an authenticated student; returns their students id. */
export async function requireStudent(ctx: AuthCtx): Promise<Id<"students">> {
  const identity = await identityOrThrow(ctx);
  const studentId = identity.studentId as Id<"students"> | undefined;
  if (identity.type !== "student" || !studentId) throw new ForbiddenError();
  return studentId;
}

/**
 * Assert the caller is the given student. Admins are allowed through so admin
 * tooling that reads a student's data keeps working.
 */
export async function requireStudentSelfOrAdmin(
  ctx: DbCtx,
  studentId: Id<"students">,
): Promise<void> {
  const identity = await identityOrThrow(ctx);
  if (identity.type === "student") {
    if (identity.studentId !== studentId) throw new ForbiddenError();
    return;
  }
  if (identity.type === "admin") {
    await requireAdmin(ctx);
    return;
  }
  throw new ForbiddenError();
}

/** Assert the caller is the given tutor (or an admin). */
export async function requireTutorSelfOrAdmin(
  ctx: DbCtx,
  tutorId: Id<"tutorAccounts">,
): Promise<void> {
  const identity = await identityOrThrow(ctx);
  if (identity.type === "admin") {
    await requireAdmin(ctx);
    return;
  }
  if (identity.type === "tutor" && identity.tutorAccountId === tutorId) {
    const account = await ctx.db.get(tutorId);
    if (!account) throw new ForbiddenError();
    return;
  }
  throw new ForbiddenError();
}

// ---------------------------------------------------------------------------
// Claims-only variants (no ctx.db) for use inside actions, which expose
// ctx.auth but not ctx.db. The token is RS256-signed and minted from a
// DB-verified login session, so trusting its claims here is sound.
// ---------------------------------------------------------------------------

export async function requireAdminClaims(ctx: AuthCtx): Promise<Id<"tutorAccounts">> {
  const identity = await identityOrThrow(ctx);
  const adminId = identity.tutorAccountId as Id<"tutorAccounts"> | undefined;
  if (identity.type !== "admin" || !adminId || !(identity.roles ?? []).includes("admin")) {
    throw new ForbiddenError();
  }
  return adminId;
}

export async function requireStudentSelfOrAdminClaims(
  ctx: AuthCtx,
  studentId: Id<"students">,
): Promise<void> {
  const identity = await identityOrThrow(ctx);
  if (identity.type === "student" && identity.studentId === studentId) return;
  if (identity.type === "admin" && (identity.roles ?? []).includes("admin")) return;
  throw new ForbiddenError();
}
