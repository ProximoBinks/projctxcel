import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  hashPassword,
  normalizeEmail,
  verifyPasswordAndMaybeUpgrade,
} from "./passwords";
import { assertServerSecret } from "./serverOnly";
import { requireAdmin } from "./identity";

// Authorize via the verified ctx.auth identity. The adminId arg is retained for
// backward compatibility with existing callers but is no longer trusted.
async function assertAdmin(ctx: any, _adminId: Id<"tutorAccounts">) {
  await requireAdmin(ctx);
}

// Tutor authentication
export const loginTutor = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      tutorId: v.id("tutorAccounts"),
      name: v.string(),
      email: v.string(),
      roles: v.array(v.string()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, { email, password }) => {
    const tutor = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", normalizeEmail(email)))
      .unique();

    if (!tutor) {
      return { success: false as const, error: "Invalid email or password" };
    }

    if (!tutor.active) {
      return { success: false as const, error: "Account is inactive" };
    }

    const { valid, newHash } = await verifyPasswordAndMaybeUpgrade(
      password,
      tutor.passwordHash,
      "tutorSalted"
    );
    if (!valid) {
      return { success: false as const, error: "Invalid email or password" };
    }
    if (newHash) {
      await ctx.db.patch(tutor._id, { passwordHash: newHash });
    }

    return {
      success: true as const,
      tutorId: tutor._id,
      name: tutor.name,
      email: tutor.email,
      roles: tutor.roles ?? ["tutor"],
    };
  },
});

// Admin authentication
export const loginAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      adminId: v.id("tutorAccounts"),
      name: v.string(),
      email: v.string(),
      roles: v.array(v.string()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, { email, password }) => {
    const admin = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", normalizeEmail(email)))
      .unique();

    if (!admin || !admin.roles?.includes("admin")) {
      return { success: false as const, error: "Invalid email or password" };
    }

    if (!admin.active) {
      return { success: false as const, error: "Account is inactive" };
    }

    const { valid, newHash } = await verifyPasswordAndMaybeUpgrade(
      password,
      admin.passwordHash,
      "tutorSalted"
    );
    if (!valid) {
      return { success: false as const, error: "Invalid email or password" };
    }
    if (newHash) {
      await ctx.db.patch(admin._id, { passwordHash: newHash });
    }

    return {
      success: true as const,
      adminId: admin._id,
      name: admin.name,
      email: admin.email,
      roles: admin.roles ?? ["tutor"],
    };
  },
});

// Create tutor account (admin only - we'll check auth on frontend)
export const createTutorAccount = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    tutorSlug: v.optional(v.string()),
    hourlyRate: v.number(),
    // Authorize via EITHER an admin caller (admin dashboard) OR the shared
    // server secret (the gated public tutor-signup API route).
    adminId: v.optional(v.id("tutorAccounts")),
    serverSecret: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ success: v.literal(true), tutorId: v.id("tutorAccounts") }),
    v.object({ success: v.literal(false), error: v.string() })
  ),
  handler: async (ctx, { email, password, name, tutorSlug, hourlyRate, adminId, serverSecret }) => {
    if (adminId) {
      await assertAdmin(ctx, adminId);
    } else if (serverSecret !== undefined) {
      assertServerSecret(serverSecret);
    } else {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", normalizeEmail(email)))
      .unique();

    if (existing) {
      return { success: false as const, error: "Email already exists" };
    }

    const passwordHash = hashPassword(password);

    const tutorId = await ctx.db.insert("tutorAccounts", {
      email: normalizeEmail(email),
      passwordHash,
      name,
      tutorSlug,
      hourlyRate,
      active: true,
      roles: ["tutor"],
    });

    return { success: true as const, tutorId };
  },
});

// Internal helper for creating tutor accounts with a pre-hashed password
export const createTutorAccountWithHash = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    tutorSlug: v.optional(v.string()),
    hourlyRate: v.number(),
  },
  returns: v.union(
    v.object({ success: v.literal(true), tutorId: v.id("tutorAccounts") }),
    v.object({ success: v.literal(false), error: v.string() })
  ),
  handler: async (ctx, { email, passwordHash, name, tutorSlug, hourlyRate }) => {
    const normalizedEmail = normalizeEmail(email);
    const existing = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existing) {
      return { success: false as const, error: "Email already exists" };
    }

    const tutorId = await ctx.db.insert("tutorAccounts", {
      email: normalizedEmail,
      passwordHash,
      name,
      tutorSlug,
      hourlyRate,
      active: true,
      roles: ["tutor"],
    });

    return { success: true as const, tutorId };
  },
});

// Create admin account.
// Internal-only: invoke from a seed/migration or `npx convex run`, never from a
// client. (Previously this was a public mutation that would mint a full admin
// to anyone who called it.)
export const createAdminAccount = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  returns: v.union(
    v.object({ success: v.literal(true), adminId: v.id("tutorAccounts") }),
    v.object({ success: v.literal(false), error: v.string() })
  ),
  handler: async (ctx, { email, password, name }) => {
    const existing = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", normalizeEmail(email)))
      .unique();

    if (existing) {
      return { success: false as const, error: "Email already exists" };
    }

    const passwordHash = hashPassword(password);

    const adminId = await ctx.db.insert("tutorAccounts", {
      email: normalizeEmail(email),
      passwordHash,
      name,
      hourlyRate: 0,
      active: true,
      roles: ["tutor", "admin"],
    });

    return { success: true as const, adminId };
  },
});

// --- Tutor Password Reset ---

export const createTutorPasswordResetToken = mutation({
  args: { email: v.string(), tokenHash: v.string(), serverSecret: v.string() },
  returns: v.object({ created: v.boolean(), name: v.optional(v.string()) }),
  handler: async (ctx, { email, tokenHash, serverSecret }) => {
    assertServerSecret(serverSecret);
    const normalizedEmail = email.toLowerCase().trim();

    const account = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!account || !account.active) {
      return { created: false };
    }

    await ctx.db.insert("passwordResetTokens", {
      email: normalizedEmail,
      tokenHash,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      used: false,
    });

    return { created: true, name: account.name };
  },
});

export const resetTutorPassword = mutation({
  args: { tokenHash: v.string(), newPassword: v.string(), serverSecret: v.string() },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { tokenHash, newPassword, serverSecret }) => {
    assertServerSecret(serverSecret);
    const token = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!token) {
      return { success: false, error: "Invalid or expired reset link." };
    }
    if (token.used) {
      return { success: false, error: "This reset link has already been used." };
    }
    if (token.expiresAt < Date.now()) {
      return { success: false, error: "This reset link has expired. Please request a new one." };
    }

    const account = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", token.email))
      .first();

    if (!account) {
      return { success: false, error: "Account not found." };
    }

    await ctx.db.patch(account._id, { passwordHash: hashPassword(newPassword) });
    await ctx.db.patch(token._id, { used: true });

    return { success: true };
  },
});

// Get tutor by ID (for session validation). Internal-only — not client-callable.
export const getTutorAccount = internalQuery({
  args: { tutorId: v.id("tutorAccounts") },
  returns: v.union(
    v.object({
      _id: v.id("tutorAccounts"),
      email: v.string(),
      name: v.string(),
      tutorSlug: v.optional(v.string()),
      hourlyRate: v.number(),
      active: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, { tutorId }) => {
    const tutor = await ctx.db.get(tutorId);
    if (!tutor) return null;
    return {
      _id: tutor._id,
      email: tutor.email,
      name: tutor.name,
      tutorSlug: tutor.tutorSlug,
      hourlyRate: tutor.hourlyRate,
      active: tutor.active,
    };
  },
});
