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

  // Tutor accounts for dashboard login
  tutorAccounts: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    tutorSlug: v.optional(v.string()), // links to tutors.slug
    hourlyRate: v.number(), // base hourly rate in cents
    active: v.boolean(),
    roles: v.optional(v.array(v.string())), // e.g. ["tutor", "admin"]
  })
    .index("by_email", ["email"])
    .index("by_tutorSlug", ["tutorSlug"]),

  // Admin accounts
  adminAccounts: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
  }).index("by_email", ["email"]),

  // Students managed by tutors
  students: defineTable({
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
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_assignedTutor", ["assignedTutorId"])
    .index("by_active", ["active"]),

  // Session logs
  sessions: defineTable({
    tutorId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    date: v.string(), // ISO date string YYYY-MM-DD
    durationMinutes: v.number(),
    subject: v.string(),
    notes: v.optional(v.string()),
    ratePerHour: v.number(), // rate in cents at time of session
    createdAt: v.number(),
  })
    .index("by_tutor", ["tutorId"])
    .index("by_student", ["studentId"])
    .index("by_tutor_and_date", ["tutorId", "date"])
    .index("by_date", ["date"]),

  // Subject rate overrides (tutor-subject specific rates)
  subjectRates: defineTable({
    tutorId: v.id("tutorAccounts"),
    subject: v.string(),
    ratePerHour: v.number(), // in cents
  })
    .index("by_tutor", ["tutorId"])
    .index("by_tutor_and_subject", ["tutorId", "subject"]),

  // Scheduled classes
  classes: defineTable({
    name: v.string(),
    subject: v.string(),
    yearLevel: v.string(),
    dayOfWeek: v.string(),
    startTime: v.string(), // "HH:MM"
    endTime: v.string(), // "HH:MM"
    location: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_day", ["dayOfWeek"])
    .index("by_active", ["active"]),

  // Tutor assignments to classes
  classAssignments: defineTable({
    classId: v.id("classes"),
    tutorId: v.id("tutorAccounts"),
    assignedAt: v.number(),
    active: v.boolean(),
  })
    .index("by_class", ["classId"])
    .index("by_tutor", ["tutorId"]),

  // Students assigned to classes
  classStudents: defineTable({
    classId: v.id("classes"),
    studentId: v.id("students"),
    assignedAt: v.number(),
    active: v.boolean(),
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"])
    .index("by_student_and_class", ["studentId", "classId"]),

  subjects: defineTable({
    name: v.string(),
    stage: v.optional(v.string()),
    label: v.string(),
    active: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_active", ["active"])
    .index("by_name", ["name"]),
});
