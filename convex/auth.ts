import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for passwords (in production, use bcrypt via action)
// This is a basic implementation - for production, use a proper hashing library
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "simple_tuition_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
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
      tutorId: v.string(),
      name: v.string(),
      email: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, { email, password }) => {
    const tutor = await ctx.db
      .query("tutorAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (!tutor) {
      return { success: false as const, error: "Invalid email or password" };
    }

    if (!tutor.active) {
      return { success: false as const, error: "Account is inactive" };
    }

    const valid = await verifyPassword(password, tutor.passwordHash);
    if (!valid) {
      return { success: false as const, error: "Invalid email or password" };
    }

    return {
      success: true as const,
      tutorId: tutor._id,
      name: tutor.name,
      email: tutor.email,
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
      adminId: v.string(),
      name: v.string(),
      email: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, { email, password }) => {
    const admin = await ctx.db
      .query("adminAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (!admin) {
      return { success: false as const, error: "Invalid email or password" };
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return { success: false as const, error: "Invalid email or password" };
    }

    return {
      success: true as const,
      adminId: admin._id,
      name: admin.name,
      email: admin.email,
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
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (existing) {
      return { success: false as const, error: "Email already exists" };
    }

    const passwordHash = await hashPassword(password);

    const tutorId = await ctx.db.insert("tutorAccounts", {
      email: email.toLowerCase(),
      passwordHash,
      name,
      tutorSlug,
      hourlyRate,
      active: true,
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
    v.object({ success: v.literal(true), adminId: v.id("adminAccounts") }),
    v.object({ success: v.literal(false), error: v.string() })
  ),
  handler: async (ctx, { email, password, name }) => {
    const existing = await ctx.db
      .query("adminAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (existing) {
      return { success: false as const, error: "Email already exists" };
    }

    const passwordHash = await hashPassword(password);

    const adminId = await ctx.db.insert("adminAccounts", {
      email: email.toLowerCase(),
      passwordHash,
      name,
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
