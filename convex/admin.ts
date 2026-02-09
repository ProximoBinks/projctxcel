import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

async function assertAdmin(ctx: { db: any }, adminId: Id<"tutorAccounts">) {
  const admin = await ctx.db.get(adminId);
  if (!admin || !admin.roles?.includes("admin")) {
    throw new Error("Unauthorized");
  }
}

// List all tutor accounts
export const listTutorAccounts = query({
  args: { adminId: v.id("tutorAccounts") },
  returns: v.array(
    v.object({
      _id: v.id("tutorAccounts"),
      email: v.string(),
      name: v.string(),
      tutorSlug: v.optional(v.string()),
      hourlyRate: v.number(),
      active: v.boolean(),
      roles: v.array(v.string()),
    })
  ),
  handler: async (ctx, { adminId }) => {
    await assertAdmin(ctx, adminId);
    const tutors = await ctx.db.query("tutorAccounts").collect();
    return tutors.map((t) => ({
      _id: t._id,
      email: t.email,
      name: t.name,
      tutorSlug: t.tutorSlug,
      hourlyRate: t.hourlyRate,
      active: t.active,
      roles: t.roles ?? ["tutor"],
    }));
  },
});

// Update tutor account
export const updateTutorAccount = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    tutorId: v.id("tutorAccounts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    tutorSlug: v.optional(v.string()),
    active: v.optional(v.boolean()),
    roles: v.optional(v.array(v.string())),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { adminId, tutorId, ...updates }) => {
    await assertAdmin(ctx, adminId);
    const tutor = await ctx.db.get(tutorId);
    if (!tutor) return { success: false, error: "Tutor not found" };

    // Check if email is being changed and if it's already in use
    if (updates.email !== undefined && updates.email !== tutor.email) {
      const existingTutor = await ctx.db
        .query("tutorAccounts")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first();
      if (existingTutor) {
        return { success: false, error: "Email already in use" };
      }
    }

    const patch: Partial<typeof tutor> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.passwordHash !== undefined) patch.passwordHash = updates.passwordHash;
    if (updates.hourlyRate !== undefined) patch.hourlyRate = updates.hourlyRate;
    if (updates.tutorSlug !== undefined) patch.tutorSlug = updates.tutorSlug;
    if (updates.active !== undefined) patch.active = updates.active;
    if (updates.roles !== undefined) patch.roles = updates.roles;

    await ctx.db.patch(tutorId, patch);
    return { success: true };
  },
});

// List all students
export const listStudents = query({
  args: { adminId: v.id("tutorAccounts") },
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
  handler: async (ctx, { adminId }) => {
    await assertAdmin(ctx, adminId);
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
    adminId: v.id("tutorAccounts"),
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
  handler: async (ctx, { adminId, ...args }) => {
    await assertAdmin(ctx, adminId);
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
    adminId: v.id("tutorAccounts"),
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
  handler: async (ctx, { adminId, studentId, ...updates }) => {
    await assertAdmin(ctx, adminId);
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

// Delete student
export const deleteStudent = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { adminId, studentId }) => {
    await assertAdmin(ctx, adminId);

    const student = await ctx.db.get(studentId);
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Delete related records
    // Delete class enrollments
    const classEnrollments = await ctx.db
      .query("classStudents")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .collect();
    for (const enrollment of classEnrollments) {
      await ctx.db.delete(enrollment._id);
    }

    // Delete sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete student resources
    const resources = await ctx.db
      .query("studentResources")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .collect();
    for (const resource of resources) {
      await ctx.db.delete(resource._id);
    }

    // Delete student account if exists
    const studentAccount = await ctx.db
      .query("studentAccounts")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .first();
    if (studentAccount) {
      await ctx.db.delete(studentAccount._id);
    }

    // Delete invite codes
    const inviteCodes = await ctx.db
      .query("studentInviteCodes")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .collect();
    for (const code of inviteCodes) {
      await ctx.db.delete(code._id);
    }

    // Finally delete the student
    await ctx.db.delete(studentId);
    return { success: true };
  },
});

// Delete tutor account
export const deleteTutorAccount = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    tutorId: v.id("tutorAccounts"),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { adminId, tutorId }) => {
    await assertAdmin(ctx, adminId);

    // Can't delete yourself
    if (adminId === tutorId) {
      return { success: false, error: "Cannot delete your own account" };
    }

    const tutor = await ctx.db.get(tutorId);
    if (!tutor) {
      return { success: false, error: "Tutor not found" };
    }

    // Delete class assignments
    const classAssignments = await ctx.db
      .query("classAssignments")
      .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId))
      .collect();
    for (const assignment of classAssignments) {
      await ctx.db.delete(assignment._id);
    }

    // Delete sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete subject rates
    const subjectRates = await ctx.db
      .query("subjectRates")
      .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId))
      .collect();
    for (const rate of subjectRates) {
      await ctx.db.delete(rate._id);
    }

    // Reassign students to a different tutor or just leave them (they'll show as orphaned)
    // For now, we'll just delete the tutor and leave students assigned to the deleted tutor ID
    // Admin should reassign students before deleting

    // Finally delete the tutor
    await ctx.db.delete(tutorId);
    return { success: true };
  },
});

// Get all sessions (for admin overview)
export const getAllSessions = query({
  args: {
    adminId: v.id("tutorAccounts"),
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
  handler: async (ctx, { adminId, startDate, endDate }) => {
    await assertAdmin(ctx, adminId);
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
    adminId: v.id("tutorAccounts"),
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
  handler: async (ctx, { adminId, startDate, endDate }) => {
    await assertAdmin(ctx, adminId);
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
    adminId: v.id("tutorAccounts"),
    tutorId: v.id("tutorAccounts"),
    subject: v.string(),
    ratePerHour: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, tutorId, subject, ratePerHour }) => {
    await assertAdmin(ctx, adminId);
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
  args: { adminId: v.id("tutorAccounts"), tutorId: v.id("tutorAccounts") },
  returns: v.array(
    v.object({
      _id: v.id("subjectRates"),
      subject: v.string(),
      ratePerHour: v.number(),
    })
  ),
  handler: async (ctx, { adminId, tutorId }) => {
    await assertAdmin(ctx, adminId);
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
  args: { adminId: v.id("tutorAccounts"), rateId: v.id("subjectRates") },
  returns: v.boolean(),
  handler: async (ctx, { adminId, rateId }) => {
    await assertAdmin(ctx, adminId);
    await ctx.db.delete(rateId);
    return true;
  },
});
