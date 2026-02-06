import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

const LEGACY_SALT = "simple_tuition_salt_2024";
const BCRYPT_ROUNDS = 12;

async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + LEGACY_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
}

async function verifyPasswordAndMaybeUpgrade(
  password: string,
  currentHash: string
): Promise<{ valid: boolean; newHash?: string }> {
  if (isBcryptHash(currentHash)) {
    const valid = bcrypt.compareSync(password, currentHash);
    return { valid };
  }

  const legacyHash = await hashPasswordLegacy(password);
  if (legacyHash !== currentHash) {
    return { valid: false };
  }

  const upgradedHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  return { valid: true, newHash: upgradedHash };
}

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
      tutor.passwordHash
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
      admin.passwordHash
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
  },
  returns: v.union(
    v.object({ success: v.literal(true), tutorId: v.id("tutorAccounts") }),
    v.object({ success: v.literal(false), error: v.string() })
  ),
  handler: async (ctx, { email, password, name, tutorSlug, hourlyRate }) => {
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

// Create admin account
export const createAdminAccount = mutation({
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

// Get tutor by ID (for session validation)
export const getTutorAccount = query({
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
