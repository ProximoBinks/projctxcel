import { query } from "./_generated/server";
import { v } from "convex/values";

export const listActive = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("testimonials"),
      _creationTime: v.number(),
      quote: v.string(),
      name: v.string(),
      context: v.optional(v.string()),
      active: v.boolean(),
      sortOrder: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("testimonials")
      .withIndex("by_active_and_sortOrder", (q) => q.eq("active", true))
      .order("asc")
      .collect();
  },
});
