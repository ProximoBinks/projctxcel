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
    type: v.optional(v.string()),
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
    consent: v.optional(v.boolean()),
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
    createdAt: v.number(),
    status: v.optional(v.string()),
  }).index("by_createdAt", ["createdAt"]),
});
