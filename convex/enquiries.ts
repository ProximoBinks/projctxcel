import { action, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    yearLevel: v.string(),
    subjects: v.string(),
    message: v.string(),
  },
  returns: v.id("enquiries"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("enquiries", {
      ...args,
      createdAt: Date.now(),
      status: "new",
    });
    return id;
  },
});
