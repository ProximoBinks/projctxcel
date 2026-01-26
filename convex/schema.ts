import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tutors: defineTable({
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
    .index("by_slug", ["slug"])
    .index("by_active_and_sortOrder", ["active", "sortOrder"]),
  testimonials: defineTable({
    quote: v.string(),
    name: v.string(),
    context: v.optional(v.string()),
    active: v.boolean(),
    sortOrder: v.number(),
  }).index("by_active_and_sortOrder", ["active", "sortOrder"]),
  enquiries: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    yearLevel: v.string(),
    subjects: v.string(),
    message: v.string(),
    createdAt: v.number(),
    status: v.optional(v.string()),
  }).index("by_createdAt", ["createdAt"]),
});
