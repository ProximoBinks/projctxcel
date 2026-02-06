"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export const createTutorAccount = action({
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
  handler: async (ctx, args) => {
    const passwordHash = await bcrypt.hash(args.password, BCRYPT_ROUNDS);
    return await ctx.runMutation(internal.auth.createTutorAccountWithHash, {
      email: args.email,
      passwordHash,
      name: args.name,
      tutorSlug: args.tutorSlug,
      hourlyRate: args.hourlyRate,
    });
  },
});
