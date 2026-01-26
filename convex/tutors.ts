import { query } from "./_generated/server";
import { v } from "convex/values";

export const listActive = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tutors"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      photoUrl: v.string(),
      headline: v.optional(v.string()),
      bioShort: v.string(),
      bioLong: v.optional(v.string()),
      subjects: v.array(v.string()),
      yearLevels: v.array(v.string()),
      stats: v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      ),
      active: v.boolean(),
      sortOrder: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("tutors")
      .withIndex("by_active_and_sortOrder", (q) => q.eq("active", true))
      .order("asc")
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("tutors"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      photoUrl: v.string(),
      headline: v.optional(v.string()),
      bioShort: v.string(),
      bioLong: v.optional(v.string()),
      subjects: v.array(v.string()),
      yearLevels: v.array(v.string()),
      stats: v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      ),
      active: v.boolean(),
      sortOrder: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("tutors")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});
