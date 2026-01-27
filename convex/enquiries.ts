import { action, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    type: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    yearLevel: v.string(),
    subjects: v.string(),
    message: v.string(),
    targetAtar: v.optional(v.string()),
    plannedCourse: v.optional(v.string()),
    interests: v.optional(v.string()),
    experience: v.optional(v.string()),
    expertise: v.optional(v.string()),
    cvFileName: v.optional(v.string()),
    cvFileType: v.optional(v.string()),
    cvFileSize: v.optional(v.number()),
    consent: v.boolean(),
    sourcePage: v.optional(v.string()),
    utm: v.optional(
      v.object({
        source: v.optional(v.string()),
        medium: v.optional(v.string()),
        campaign: v.optional(v.string()),
        term: v.optional(v.string()),
        content: v.optional(v.string()),
      })
    ),
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
