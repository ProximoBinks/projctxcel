import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// List all tutor accounts
export const listTutorAccounts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tutorAccounts"),
      email: v.string(),
      name: v.string(),
      tutorSlug: v.optional(v.string()),
      hourlyRate: v.number(),
      active: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const tutors = await ctx.db.query("tutorAccounts").collect();
    return tutors.map((t) => ({
      _id: t._id,
      email: t.email,
      name: t.name,
      tutorSlug: t.tutorSlug,
      hourlyRate: t.hourlyRate,
      active: t.active,
    }));
  },
});

// Update tutor account
export const updateTutorAccount = mutation({
  args: {
    tutorId: v.id("tutorAccounts"),
    name: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    tutorSlug: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, { tutorId, ...updates }) => {
    const tutor = await ctx.db.get(tutorId);
    if (!tutor) return false;

    const patch: Partial<typeof tutor> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.hourlyRate !== undefined) patch.hourlyRate = updates.hourlyRate;
    if (updates.tutorSlug !== undefined) patch.tutorSlug = updates.tutorSlug;
    if (updates.active !== undefined) patch.active = updates.active;

    await ctx.db.patch(tutorId, patch);
    return true;
  },
});

// List all students
export const listStudents = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("students"),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      parentName: v.optional(v.string()),
      parentEmail: v.optional(v.string()),
      parentPhone: v.optional(v.string()),
      yearLevel: v.string(),
      subjects: v.array(v.string()),
      assignedTutorId: v.id("tutorAccounts"),
      assignedTutorName: v.string(),
      notes: v.optional(v.string()),
      active: v.boolean(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();

    return Promise.all(
      students.map(async (s) => {
        const tutor = await ctx.db.get(s.assignedTutorId);
        return {
          _id: s._id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          parentName: s.parentName,
          parentEmail: s.parentEmail,
          parentPhone: s.parentPhone,
          yearLevel: s.yearLevel,
          subjects: s.subjects,
          assignedTutorId: s.assignedTutorId,
          assignedTutorName: tutor?.name ?? "Unknown",
          notes: s.notes,
          active: s.active,
          createdAt: s.createdAt,
        };
      })
    );
  },
});

// Create student
export const createStudent = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    yearLevel: v.string(),
    subjects: v.array(v.string()),
    assignedTutorId: v.id("tutorAccounts"),
    notes: v.optional(v.string()),
  },
  returns: v.id("students"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("students", {
      ...args,
      active: true,
      createdAt: Date.now(),
    });
  },
});

// Update student
export const updateStudent = mutation({
  args: {
    studentId: v.id("students"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    yearLevel: v.optional(v.string()),
    subjects: v.optional(v.array(v.string())),
    assignedTutorId: v.optional(v.id("tutorAccounts")),
    notes: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, { studentId, ...updates }) => {
    const student = await ctx.db.get(studentId);
    if (!student) return false;

    const patch: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) patch[key] = value;
    });

    await ctx.db.patch(studentId, patch);
    return true;
  },
});

// Get all sessions (for admin overview)
export const getAllSessions = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("sessions"),
      tutorId: v.id("tutorAccounts"),
      tutorName: v.string(),
      studentId: v.id("students"),
      studentName: v.string(),
      date: v.string(),
      durationMinutes: v.number(),
      subject: v.string(),
      notes: v.optional(v.string()),
      ratePerHour: v.number(),
      earnings: v.number(),
    })
  ),
  handler: async (ctx, { startDate, endDate }) => {
    let sessions = await ctx.db.query("sessions").collect();

    if (startDate) {
      sessions = sessions.filter((s) => s.date >= startDate);
    }
    if (endDate) {
      sessions = sessions.filter((s) => s.date <= endDate);
    }

    const results = await Promise.all(
      sessions.map(async (session) => {
        const tutor = await ctx.db.get(session.tutorId);
        const student = await ctx.db.get(session.studentId);
        const earnings = Math.round(
          (session.durationMinutes / 60) * session.ratePerHour
        );
        return {
          _id: session._id,
          tutorId: session.tutorId,
          tutorName: tutor?.name ?? "Unknown",
          studentId: session.studentId,
          studentName: student?.name ?? "Unknown",
          date: session.date,
          durationMinutes: session.durationMinutes,
          subject: session.subject,
          notes: session.notes,
          ratePerHour: session.ratePerHour,
          earnings,
        };
      })
    );

    return results.sort((a, b) => b.date.localeCompare(a.date));
  },
});

// Get earnings summary by tutor
export const getEarningsSummary = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  returns: v.array(
    v.object({
      tutorId: v.id("tutorAccounts"),
      tutorName: v.string(),
      totalMinutes: v.number(),
      totalEarnings: v.number(),
      sessionCount: v.number(),
    })
  ),
  handler: async (ctx, { startDate, endDate }) => {
    const sessions = await ctx.db.query("sessions").collect();
    const filtered = sessions.filter(
      (s) => s.date >= startDate && s.date <= endDate
    );

    // Group by tutor
    const byTutor = new Map<
      string,
      { totalMinutes: number; totalEarnings: number; sessionCount: number }
    >();

    for (const session of filtered) {
      const tutorId = session.tutorId;
      const existing = byTutor.get(tutorId) ?? {
        totalMinutes: 0,
        totalEarnings: 0,
        sessionCount: 0,
      };
      existing.totalMinutes += session.durationMinutes;
      existing.totalEarnings += Math.round(
        (session.durationMinutes / 60) * session.ratePerHour
      );
      existing.sessionCount += 1;
      byTutor.set(tutorId, existing);
    }

    const results = await Promise.all(
      Array.from(byTutor.entries()).map(async ([tutorIdStr, stats]) => {
        const tutorId = tutorIdStr as Id<"tutorAccounts">;
        const tutor = await ctx.db.get(tutorId);
        return {
          tutorId,
          tutorName: tutor?.name ?? "Unknown",
          ...stats,
        };
      })
    );

    return results.sort((a, b) => b.totalEarnings - a.totalEarnings);
  },
});

// Set subject-specific rate for a tutor
export const setSubjectRate = mutation({
  args: {
    tutorId: v.id("tutorAccounts"),
    subject: v.string(),
    ratePerHour: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, { tutorId, subject, ratePerHour }) => {
    const existing = await ctx.db
      .query("subjectRates")
      .withIndex("by_tutor_and_subject", (q) =>
        q.eq("tutorId", tutorId).eq("subject", subject)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ratePerHour });
    } else {
      await ctx.db.insert("subjectRates", { tutorId, subject, ratePerHour });
    }

    return true;
  },
});

// Get subject rates for a tutor
export const getSubjectRates = query({
  args: { tutorId: v.id("tutorAccounts") },
  returns: v.array(
    v.object({
      _id: v.id("subjectRates"),
      subject: v.string(),
      ratePerHour: v.number(),
    })
  ),
  handler: async (ctx, { tutorId }) => {
    const rates = await ctx.db
      .query("subjectRates")
      .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId))
      .collect();

    return rates.map((r) => ({
      _id: r._id,
      subject: r.subject,
      ratePerHour: r.ratePerHour,
    }));
  },
});

// Delete subject rate
export const deleteSubjectRate = mutation({
  args: { rateId: v.id("subjectRates") },
  returns: v.boolean(),
  handler: async (ctx, { rateId }) => {
    await ctx.db.delete(rateId);
    return true;
  },
});
