import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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

    const typeLabel =
      args.type === "tutor"
        ? "Tutor Application"
        : args.type === "general"
          ? "General Enquiry"
          : "Student Enquiry";
    const lines = [
      `**Name:** ${args.name}`,
      `**Email:** ${args.email}`,
      `**Phone:** ${args.phone ?? "N/A"}`,
    ];
    if (args.type === "student") {
      if (args.yearLevel) lines.push(`**Year Level:** ${args.yearLevel}`);
      if (args.subjects) lines.push(`**Subjects:** ${args.subjects}`);
    }
    if (args.message) lines.push(`**Message:** ${args.message}`);

    await ctx.scheduler.runAfter(0, internal.discord.notify, {
      title: `New ${typeLabel}`,
      description: lines.join("\n"),
      color: 0x2563eb,
    });

    return id;
  },
});

export const list = query({
  args: { adminId: v.id("tutorAccounts") },
  returns: v.array(
    v.object({
      _id: v.id("enquiries"),
      _creationTime: v.number(),
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
      consent: v.optional(v.boolean()),
      sourcePage: v.optional(v.string()),
      createdAt: v.number(),
      status: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin || !admin.roles?.includes("admin")) return [];

    const enquiries = await ctx.db
      .query("enquiries")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    return enquiries.map((e) => ({
      _id: e._id,
      _creationTime: e._creationTime,
      type: e.type,
      name: e.name,
      email: e.email,
      phone: e.phone,
      yearLevel: e.yearLevel,
      subjects: e.subjects,
      message: e.message,
      targetAtar: e.targetAtar,
      plannedCourse: e.plannedCourse,
      interests: e.interests,
      experience: e.experience,
      expertise: e.expertise,
      cvFileName: e.cvFileName,
      consent: e.consent,
      sourcePage: e.sourcePage,
      createdAt: e.createdAt,
      status: e.status,
    }));
  },
});

export const remove = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    enquiryId: v.id("enquiries"),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, enquiryId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin || !admin.roles?.includes("admin")) return false;

    const enquiry = await ctx.db.get(enquiryId);
    if (!enquiry) return false;

    await ctx.db.delete(enquiryId);
    return true;
  },
});
