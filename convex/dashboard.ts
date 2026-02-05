import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get students assigned to a tutor
export const getMyStudents = query({
  args: { tutorId: v.id("tutorAccounts") },
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
      notes: v.optional(v.string()),
      active: v.boolean(),
    })
  ),
  handler: async (ctx, { tutorId }) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_assignedTutor", (q) => q.eq("assignedTutorId", tutorId))
      .collect();

    return students.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      parentName: s.parentName,
      parentEmail: s.parentEmail,
      parentPhone: s.parentPhone,
      yearLevel: s.yearLevel,
      subjects: s.subjects,
      notes: s.notes,
      active: s.active,
    }));
  },
});

// Log a session
export const logSession = mutation({
  args: {
    tutorId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    date: v.string(),
    durationMinutes: v.number(),
    subject: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.id("sessions"),
  handler: async (ctx, { tutorId, studentId, date, durationMinutes, subject, notes }) => {
    // Get the rate for this session
    const tutor = await ctx.db.get(tutorId);
    if (!tutor) throw new Error("Tutor not found");

    // Check for subject-specific rate
    const subjectRate = await ctx.db
      .query("subjectRates")
      .withIndex("by_tutor_and_subject", (q) =>
        q.eq("tutorId", tutorId).eq("subject", subject)
      )
      .unique();

    const ratePerHour = subjectRate?.ratePerHour ?? tutor.hourlyRate;

    return await ctx.db.insert("sessions", {
      tutorId,
      studentId,
      date,
      durationMinutes,
      subject,
      notes,
      ratePerHour,
      createdAt: Date.now(),
    });
  },
});

// Get sessions for a tutor
export const getMySessions = query({
  args: {
    tutorId: v.id("tutorAccounts"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("sessions"),
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
  handler: async (ctx, { tutorId, startDate, endDate }) => {
    let sessionsQuery = ctx.db
      .query("sessions")
      .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId));

    const sessions = await sessionsQuery.collect();

    // Filter by date range if provided
    const filtered = sessions.filter((s) => {
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      return true;
    });

    // Get student names
    const results = await Promise.all(
      filtered.map(async (session) => {
        const student = await ctx.db.get(session.studentId);
        const earnings = Math.round(
          (session.durationMinutes / 60) * session.ratePerHour
        );
        return {
          _id: session._id,
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

    // Sort by date descending
    return results.sort((a, b) => b.date.localeCompare(a.date));
  },
});

// Get weekly earnings summary
export const getWeeklyEarnings = query({
  args: { tutorId: v.id("tutorAccounts") },
  returns: v.object({
    currentWeek: v.object({
      totalMinutes: v.number(),
      totalEarnings: v.number(),
      sessionCount: v.number(),
    }),
    lastWeek: v.object({
      totalMinutes: v.number(),
      totalEarnings: v.number(),
      sessionCount: v.number(),
    }),
  }),
  handler: async (ctx, { tutorId }) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Current week Monday
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - mondayOffset);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Last week Monday
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId))
      .collect();

    const currentWeekSessions = sessions.filter(
      (s) => s.date >= formatDate(currentWeekStart)
    );
    const lastWeekSessions = sessions.filter(
      (s) =>
        s.date >= formatDate(lastWeekStart) && s.date <= formatDate(lastWeekEnd)
    );

    const calcStats = (sessionList: typeof sessions) => ({
      totalMinutes: sessionList.reduce((sum, s) => sum + s.durationMinutes, 0),
      totalEarnings: sessionList.reduce(
        (sum, s) => sum + Math.round((s.durationMinutes / 60) * s.ratePerHour),
        0
      ),
      sessionCount: sessionList.length,
    });

    return {
      currentWeek: calcStats(currentWeekSessions),
      lastWeek: calcStats(lastWeekSessions),
    };
  },
});

// Update student notes (tutor can update notes for their students)
export const updateStudentNotes = mutation({
  args: {
    tutorId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    notes: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { tutorId, studentId, notes }) => {
    const student = await ctx.db.get(studentId);
    if (!student || student.assignedTutorId !== tutorId) {
      return false;
    }

    await ctx.db.patch(studentId, { notes });
    return true;
  },
});

// Delete a session (tutor can delete their own sessions)
export const deleteSession = mutation({
  args: {
    tutorId: v.id("tutorAccounts"),
    sessionId: v.id("sessions"),
  },
  returns: v.boolean(),
  handler: async (ctx, { tutorId, sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.tutorId !== tutorId) {
      return false;
    }

    await ctx.db.delete(sessionId);
    return true;
  },
});
