import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const classWithTutorValidator = v.object({
  _id: v.id("classes"),
  name: v.string(),
  subject: v.string(),
  yearLevel: v.string(),
  dayOfWeek: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  location: v.optional(v.string()),
  active: v.boolean(),
  tutorId: v.optional(v.id("tutorAccounts")),
  tutorName: v.optional(v.string()),
});

async function assertAdmin(ctx: { db: any }, adminId: Id<"tutorAccounts">) {
  const admin = await ctx.db.get(adminId);
  if (!admin || !admin.roles?.includes("admin")) {
    throw new Error("Unauthorized");
  }
}

export const listClasses = query({
  args: { adminId: v.id("tutorAccounts") },
  returns: v.array(classWithTutorValidator),
  handler: async (ctx, { adminId }) => {
    await assertAdmin(ctx, adminId);
    const classes = await ctx.db.query("classes").collect();
    const results = await Promise.all(
      classes.map(async (cls) => {
        const assignments = await ctx.db
          .query("classAssignments")
          .withIndex("by_class", (q) => q.eq("classId", cls._id))
          .collect();
        const assignment = assignments.find((a) => a.active);
        const tutor = assignment
          ? await ctx.db.get(assignment.tutorId)
          : null;
        return {
          _id: cls._id,
          name: cls.name,
          subject: cls.subject,
          yearLevel: cls.yearLevel,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
          location: cls.location,
          active: cls.active,
          tutorId: tutor?._id,
          tutorName: tutor?.name,
        };
      })
    );
    return results;
  },
});

export const getClassesForTutor = query({
  args: { tutorId: v.id("tutorAccounts") },
  returns: v.array(classWithTutorValidator),
  handler: async (ctx, { tutorId }) => {
    const assignments = await ctx.db
      .query("classAssignments")
      .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId))
      .collect();
    const activeAssignments = assignments.filter((a) => a.active);
    const classes = await Promise.all(
      activeAssignments.map(async (assignment) => {
        const cls = await ctx.db.get(assignment.classId);
        if (!cls) return null;
        return {
          _id: cls._id,
          name: cls.name,
          subject: cls.subject,
          yearLevel: cls.yearLevel,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
          location: cls.location,
          active: cls.active,
          tutorId,
          tutorName: undefined,
        };
      })
    );
    return classes.filter((c): c is NonNullable<typeof c> => Boolean(c));
  },
});

export const createClass = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    name: v.string(),
    subject: v.string(),
    yearLevel: v.string(),
    dayOfWeek: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    location: v.optional(v.string()),
  },
  returns: v.id("classes"),
  handler: async (ctx, { adminId, ...args }) => {
    await assertAdmin(ctx, adminId);
    return await ctx.db.insert("classes", {
      ...args,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const updateClass = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    classId: v.id("classes"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    yearLevel: v.optional(v.string()),
    dayOfWeek: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, classId, ...updates }) => {
    await assertAdmin(ctx, adminId);
    const cls = await ctx.db.get(classId);
    if (!cls) return false;

    const patch: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) patch[key] = value;
    });

    await ctx.db.patch(classId, patch);
    return true;
  },
});

export const archiveClass = mutation({
  args: { adminId: v.id("tutorAccounts"), classId: v.id("classes") },
  returns: v.boolean(),
  handler: async (ctx, { adminId, classId }) => {
    await assertAdmin(ctx, adminId);
    const cls = await ctx.db.get(classId);
    if (!cls) return false;
    await ctx.db.patch(classId, { active: false });
    return true;
  },
});

export const assignTutorToClass = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    classId: v.id("classes"),
    tutorId: v.id("tutorAccounts"),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, classId, tutorId }) => {
    await assertAdmin(ctx, adminId);
    const cls = await ctx.db.get(classId);
    if (!cls) return false;

    const existingAssignments = await ctx.db
      .query("classAssignments")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();
    const activeAssignment = existingAssignments.find((a) => a.active);
    if (activeAssignment) {
      await ctx.db.patch(activeAssignment._id, { active: false });
    }

    await ctx.db.insert("classAssignments", {
      classId,
      tutorId,
      assignedAt: Date.now(),
      active: true,
    });
    return true;
  },
});

export const unassignTutorFromClass = mutation({
  args: { adminId: v.id("tutorAccounts"), classId: v.id("classes") },
  returns: v.boolean(),
  handler: async (ctx, { adminId, classId }) => {
    await assertAdmin(ctx, adminId);
    const assignments = await ctx.db
      .query("classAssignments")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();
    const activeAssignment = assignments.find((a) => a.active);
    if (!activeAssignment) return false;
    await ctx.db.patch(activeAssignment._id, { active: false });
    return true;
  },
});

export const listClassStudents = query({
  args: { adminId: v.id("tutorAccounts"), classId: v.id("classes") },
  returns: v.array(
    v.object({
      _id: v.id("students"),
      name: v.string(),
      yearLevel: v.string(),
    })
  ),
  handler: async (ctx, { adminId, classId }) => {
    await assertAdmin(ctx, adminId);
    const links = await ctx.db
      .query("classStudents")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();
    const activeLinks = links.filter((link) => link.active);
    const students = await Promise.all(
      activeLinks.map(async (link) => {
        const student = await ctx.db.get(link.studentId);
        if (!student) return null;
        return {
          _id: student._id,
          name: student.name,
          yearLevel: student.yearLevel,
        };
      })
    );
    return students.filter((s): s is NonNullable<typeof s> => Boolean(s));
  },
});

export const listStudentClasses = query({
  args: { adminId: v.id("tutorAccounts"), studentId: v.id("students") },
  returns: v.array(
    v.object({
      _id: v.id("classes"),
      name: v.string(),
      dayOfWeek: v.string(),
      startTime: v.string(),
      endTime: v.string(),
    })
  ),
  handler: async (ctx, { adminId, studentId }) => {
    await assertAdmin(ctx, adminId);
    const links = await ctx.db
      .query("classStudents")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .collect();
    const activeLinks = links.filter((link) => link.active);
    const classes = await Promise.all(
      activeLinks.map(async (link) => {
        const cls = await ctx.db.get(link.classId);
        if (!cls) return null;
        return {
          _id: cls._id,
          name: cls.name,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
        };
      })
    );
    return classes.filter((c): c is NonNullable<typeof c> => Boolean(c));
  },
});

export const assignStudentToClass = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    classId: v.id("classes"),
    studentId: v.id("students"),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, classId, studentId }) => {
    await assertAdmin(ctx, adminId);
    const existing = await ctx.db
      .query("classStudents")
      .withIndex("by_student_and_class", (q) =>
        q.eq("studentId", studentId).eq("classId", classId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { active: true, assignedAt: Date.now() });
      return true;
    }
    await ctx.db.insert("classStudents", {
      classId,
      studentId,
      assignedAt: Date.now(),
      active: true,
    });
    return true;
  },
});

export const unassignStudentFromClass = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    classId: v.id("classes"),
    studentId: v.id("students"),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, classId, studentId }) => {
    await assertAdmin(ctx, adminId);
    const existing = await ctx.db
      .query("classStudents")
      .withIndex("by_student_and_class", (q) =>
        q.eq("studentId", studentId).eq("classId", classId)
      )
      .unique();
    if (!existing) return false;
    await ctx.db.patch(existing._id, { active: false });
    return true;
  },
});
