import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Generate a random invite code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing characters
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Hash password (simple SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Admin: Generate invite code for a student
export const generateInviteCode = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
  },
  returns: v.object({ success: v.boolean(), code: v.optional(v.string()), error: v.optional(v.string()) }),
  handler: async (ctx, { adminId, studentId }) => {
    // Verify admin
    const admin = await ctx.db.get(adminId);
    if (!admin || !admin.roles?.includes("admin")) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify student exists
    const student = await ctx.db.get(studentId);
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check if student already has an account
    const existingAccount = await ctx.db
      .query("studentAccounts")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .first();
    if (existingAccount) {
      return { success: false, error: "Student already has an account" };
    }

    // Check if there's already an unused invite code for this student
    const existingCode = await ctx.db
      .query("studentInviteCodes")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .filter((q) => q.eq(q.field("used"), false))
      .first();
    if (existingCode) {
      return { success: true, code: existingCode.code };
    }

    // Generate new unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("studentInviteCodes")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    await ctx.db.insert("studentInviteCodes", {
      code,
      studentId,
      createdBy: adminId,
      used: false,
      createdAt: Date.now(),
    });

    return { success: true, code };
  },
});

// Student: Verify invite code (for signup page)
export const verifyInviteCode = query({
  args: { code: v.string() },
  returns: v.object({
    valid: v.boolean(),
    studentName: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, { code }) => {
    const invite = await ctx.db
      .query("studentInviteCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();

    if (!invite) {
      return { valid: false, error: "Invalid invite code" };
    }

    if (invite.used) {
      return { valid: false, error: "This invite code has already been used" };
    }

    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return { valid: false, error: "This invite code has expired" };
    }

    const student = await ctx.db.get(invite.studentId);
    if (!student) {
      return { valid: false, error: "Student not found" };
    }

    return { valid: true, studentName: student.name };
  },
});

// Student: Signup with invite code
export const signupWithCode = mutation({
  args: {
    code: v.string(),
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { code, email, password }) => {
    const invite = await ctx.db
      .query("studentInviteCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();

    if (!invite || invite.used) {
      return { success: false, error: "Invalid or used invite code" };
    }

    // Check if email already in use
    const existingAccount = await ctx.db
      .query("studentAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (existingAccount) {
      return { success: false, error: "Email already in use" };
    }

    // Create student account
    const passwordHash = await hashPassword(password);
    await ctx.db.insert("studentAccounts", {
      studentId: invite.studentId,
      email: email.toLowerCase(),
      passwordHash,
      active: true,
      createdAt: Date.now(),
    });

    // Mark invite code as used
    await ctx.db.patch(invite._id, {
      used: true,
      usedAt: Date.now(),
    });

    // Update student record with email if not set
    const student = await ctx.db.get(invite.studentId);
    if (student && !student.email) {
      await ctx.db.patch(invite.studentId, { email: email.toLowerCase() });
    }

    return { success: true };
  },
});

// Student: Login
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    studentAccountId: v.optional(v.id("studentAccounts")),
    studentId: v.optional(v.id("students")),
    name: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, { email, password }) => {
    const account = await ctx.db
      .query("studentAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!account) {
      return { success: false, error: "Invalid email or password" };
    }

    if (!account.active) {
      return { success: false, error: "Account is deactivated" };
    }

    const passwordHash = await hashPassword(password);
    if (account.passwordHash !== passwordHash) {
      return { success: false, error: "Invalid email or password" };
    }

    const student = await ctx.db.get(account.studentId);

    return {
      success: true,
      studentAccountId: account._id,
      studentId: account.studentId,
      name: student?.name,
    };
  },
});

// Student: Get overview data
export const getOverview = query({
  args: { studentId: v.id("students") },
  returns: v.object({
    student: v.object({
      name: v.string(),
      yearLevel: v.string(),
      subjects: v.array(v.string()),
    }),
    tutors: v.array(
      v.object({
        _id: v.id("tutorAccounts"),
        name: v.string(),
        email: v.string(),
        subjects: v.array(v.string()),
      })
    ),
    upcomingSessions: v.array(
      v.object({
        className: v.string(),
        subject: v.string(),
        dayOfWeek: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        tutorName: v.string(),
      })
    ),
    recentResources: v.array(
      v.object({
        _id: v.id("studentResources"),
        title: v.string(),
        subject: v.optional(v.string()),
        createdAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, { studentId }) => {
    const student = await ctx.db.get(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Get all classes the student is enrolled in
    const classEnrollments = await ctx.db
      .query("classStudents")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Get unique tutors from class assignments
    const tutorIds = new Set<Id<"tutorAccounts">>();
    const upcomingSessions: Array<{
      className: string;
      subject: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      tutorName: string;
    }> = [];

    // Also add the primary assigned tutor if present
    if (student.assignedTutorId) {
      tutorIds.add(student.assignedTutorId);
    }

    for (const enrollment of classEnrollments) {
      const cls = await ctx.db.get(enrollment.classId);
      if (!cls || !cls.active) continue;

      // Get tutor for this class
      const assignment = await ctx.db
        .query("classAssignments")
        .withIndex("by_class", (q) => q.eq("classId", enrollment.classId))
        .filter((q) => q.eq(q.field("active"), true))
        .first();

      if (assignment) {
        tutorIds.add(assignment.tutorId);
        const tutor = await ctx.db.get(assignment.tutorId);
        upcomingSessions.push({
          className: cls.name,
          subject: cls.subject,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
          tutorName: tutor?.name || "Unknown",
        });
      }
    }

    // Get tutor details
    const tutors = await Promise.all(
      Array.from(tutorIds).map(async (tutorId) => {
        const tutor = await ctx.db.get(tutorId);
        if (!tutor) return null;

        // Get subjects this tutor teaches to this student (from classes)
        const tutorClasses = await ctx.db
          .query("classAssignments")
          .withIndex("by_tutor", (q) => q.eq("tutorId", tutorId))
          .filter((q) => q.eq(q.field("active"), true))
          .collect();

        const subjects = new Set<string>();
        for (const assignment of tutorClasses) {
          const cls = await ctx.db.get(assignment.classId);
          if (cls) subjects.add(cls.subject);
        }

        return {
          _id: tutor._id,
          name: tutor.name,
          email: tutor.email,
          subjects: Array.from(subjects),
        };
      })
    );

    // Get recent resources
    const resources = await ctx.db
      .query("studentResources")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(5);

    return {
      student: {
        name: student.name,
        yearLevel: student.yearLevel,
        subjects: student.subjects,
      },
      tutors: tutors.filter((t): t is NonNullable<typeof t> => t !== null),
      upcomingSessions,
      recentResources: resources.map((r) => ({
        _id: r._id,
        title: r.title,
        subject: r.subject,
        createdAt: r.createdAt,
      })),
    };
  },
});

// Student: Get timetable (classes they're enrolled in)
export const getTimetable = query({
  args: { studentId: v.id("students") },
  returns: v.array(
    v.object({
      _id: v.id("classes"),
      name: v.string(),
      subject: v.string(),
      yearLevel: v.string(),
      dayOfWeek: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      location: v.optional(v.string()),
      tutorName: v.string(),
    })
  ),
  handler: async (ctx, { studentId }) => {
    const enrollments = await ctx.db
      .query("classStudents")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const classes = await Promise.all(
      enrollments.map(async (enrollment) => {
        const cls = await ctx.db.get(enrollment.classId);
        if (!cls || !cls.active) return null;

        // Get tutor for this class
        const assignment = await ctx.db
          .query("classAssignments")
          .withIndex("by_class", (q) => q.eq("classId", enrollment.classId))
          .filter((q) => q.eq(q.field("active"), true))
          .first();

        let tutorName = "TBA";
        if (assignment) {
          const tutor = await ctx.db.get(assignment.tutorId);
          tutorName = tutor?.name || "Unknown";
        }

        return {
          _id: cls._id,
          name: cls.name,
          subject: cls.subject,
          yearLevel: cls.yearLevel,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
          location: cls.location,
          tutorName,
        };
      })
    );

    return classes.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

// Student: Get all resources
export const getResources = query({
  args: { studentId: v.id("students") },
  returns: v.array(
    v.object({
      _id: v.id("studentResources"),
      title: v.string(),
      description: v.optional(v.string()),
      url: v.optional(v.string()),
      subject: v.optional(v.string()),
      createdByName: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { studentId }) => {
    const resources = await ctx.db
      .query("studentResources")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .collect();

    return Promise.all(
      resources.map(async (r) => {
        const creator = await ctx.db.get(r.createdBy);
        return {
          _id: r._id,
          title: r.title,
          description: r.description,
          url: r.url,
          subject: r.subject,
          createdByName: creator?.name || "Unknown",
          createdAt: r.createdAt,
        };
      })
    );
  },
});

// Tutor/Admin: Add resource for a student
export const addResource = mutation({
  args: {
    creatorId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    title: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { creatorId, studentId, title, description, url, subject }) => {
    const creator = await ctx.db.get(creatorId);
    if (!creator || !creator.active) {
      return { success: false, error: "Unauthorized" };
    }

    const student = await ctx.db.get(studentId);
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    await ctx.db.insert("studentResources", {
      studentId,
      title,
      description,
      url,
      subject,
      createdBy: creatorId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Tutor/Admin: Delete resource
export const deleteResource = mutation({
  args: {
    creatorId: v.id("tutorAccounts"),
    resourceId: v.id("studentResources"),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { creatorId, resourceId }) => {
    const creator = await ctx.db.get(creatorId);
    if (!creator || !creator.active) {
      return { success: false, error: "Unauthorized" };
    }

    const resource = await ctx.db.get(resourceId);
    if (!resource) {
      return { success: false, error: "Resource not found" };
    }

    await ctx.db.delete(resourceId);
    return { success: true };
  },
});

// Student: Self-signup (no invite code required)
export const signupStudent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, { name, email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already in use in studentAccounts
    const existingAccount = await ctx.db
      .query("studentAccounts")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existingAccount) {
      return { success: false, error: "Email already in use" };
    }

    // Create the student record
    const studentId = await ctx.db.insert("students", {
      name: name.trim(),
      email: normalizedEmail,
      yearLevel: "Not Set",
      subjects: [],
      assignedTutorId: null,
      active: true,
      createdAt: Date.now(),
    });

    // Create student account
    const passwordHash = await hashPassword(password);
    await ctx.db.insert("studentAccounts", {
      studentId,
      email: normalizedEmail,
      passwordHash,
      active: true,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin: List all invite codes
export const listInviteCodes = query({
  args: { adminId: v.id("tutorAccounts") },
  returns: v.array(
    v.object({
      _id: v.id("studentInviteCodes"),
      code: v.string(),
      studentName: v.string(),
      studentId: v.id("students"),
      used: v.boolean(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { adminId }) => {
    const admin = await ctx.db.get(adminId);
    if (!admin || !admin.roles?.includes("admin")) {
      return [];
    }

    const codes = await ctx.db.query("studentInviteCodes").order("desc").collect();

    return Promise.all(
      codes.map(async (code) => {
        const student = await ctx.db.get(code.studentId);
        return {
          _id: code._id,
          code: code.code,
          studentName: student?.name || "Unknown",
          studentId: code.studentId,
          used: code.used,
          createdAt: code.createdAt,
        };
      })
    );
  },
});
