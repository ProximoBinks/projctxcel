import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const defaultSubjects = [
  { name: "UCAT" },
  { name: "Interview Prep" },
  { name: "Specialist Maths" },
  { name: "Maths Methods" },
  { name: "Physics" },
  { name: "Research Project" },
  { name: "English Literature" },
  { name: "Accounting" },
  { name: "Stage 1 English", stage: "Stage 1", baseName: "English" },
  { name: "Stage 2 English", stage: "Stage 2", baseName: "English" },
  {
    name: "Stage 1 Mathematical Methods",
    stage: "Stage 1",
    baseName: "Mathematical Methods",
  },
  {
    name: "Stage 2 Mathematical Methods",
    stage: "Stage 2",
    baseName: "Mathematical Methods",
  },
  { name: "Stage 1 Psychology", stage: "Stage 1", baseName: "Psychology" },
  { name: "Stage 2 Psychology", stage: "Stage 2", baseName: "Psychology" },
  { name: "Stage 1 Biology", stage: "Stage 1", baseName: "Biology" },
  { name: "Stage 2 Biology", stage: "Stage 2", baseName: "Biology" },
  {
    name: "Stage 1 Essential Mathematics",
    stage: "Stage 1",
    baseName: "Essential Mathematics",
  },
  {
    name: "Stage 2 Essential Mathematics",
    stage: "Stage 2",
    baseName: "Essential Mathematics",
  },
  {
    name: "Stage 1 General Mathematics",
    stage: "Stage 1",
    baseName: "General Mathematics",
  },
  {
    name: "Stage 2 General Mathematics",
    stage: "Stage 2",
    baseName: "General Mathematics",
  },
  { name: "Stage 1 Chemistry", stage: "Stage 1", baseName: "Chemistry" },
  { name: "Stage 2 Chemistry", stage: "Stage 2", baseName: "Chemistry" },
];

export const listSubjects = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("subjects"),
      name: v.string(),
      stage: v.optional(v.string()),
      label: v.string(),
      active: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return subjects
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((subject) => ({
        _id: subject._id,
        name: subject.name,
        stage: subject.stage,
        label: subject.label,
        active: subject.active,
      }));
  },
});

export const seedSubjects = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("subjects").collect();
    if (existing.length > 0) return null;

    let order = 0;
    for (const subject of defaultSubjects) {
      const label = subject.name;
      const name = subject.baseName ?? subject.name;
      await ctx.db.insert("subjects", {
        name,
        stage: subject.stage,
        label,
        active: true,
        sortOrder: order++,
      });
    }

    return null;
  },
});
