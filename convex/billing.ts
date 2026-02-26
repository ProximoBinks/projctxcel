import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function assertAdmin(ctx: { db: any }, adminId: Id<"tutorAccounts">) {
  const admin = await ctx.db.get(adminId);
  if (!admin || !admin.roles?.includes("admin")) {
    throw new Error("Unauthorized");
  }
}

// ---------------------------------------------------------------------------
// Rate calculation (pause-aware, supports daily + weekly views)
// ---------------------------------------------------------------------------

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const breakdownLineValidator = v.object({
  className: v.string(),
  classId: v.id("classes"),
  subject: v.string(),
  dayOfWeek: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  durationMinutes: v.number(),
  tutorName: v.string(),
  rateCents: v.number(),
  lineTotalCents: v.number(),
  paused: v.boolean(),
});

const weeklyRateValidator = v.object({
  totalCents: v.number(),
  breakdown: v.array(breakdownLineValidator),
});

type BreakdownLine = {
  className: string;
  classId: Id<"classes">;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  tutorName: string;
  rateCents: number;
  lineTotalCents: number;
  paused: boolean;
};

type WeeklyRate = {
  totalCents: number;
  breakdown: BreakdownLine[];
};

function getTodayAdelaide(): string {
  // ACST is UTC+9:30; close enough for date calculation
  const now = new Date();
  const adelaideMs = now.getTime() + (9.5 * 60 * 60 * 1000);
  return new Date(adelaideMs).toISOString().split("T")[0];
}

function getDayOfWeekAdelaide(): string {
  const now = new Date();
  const adelaideMs = now.getTime() + (9.5 * 60 * 60 * 1000);
  const d = new Date(adelaideMs);
  return DAY_ORDER[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

async function isClassPausedForStudent(
  ctx: QueryCtx,
  studentId: Id<"students">,
  classId: Id<"classes">,
  referenceDate: string,
): Promise<boolean> {
  const requests = await ctx.db
    .query("pauseRequests")
    .withIndex("by_class_and_status", (q) =>
      q.eq("classId", classId).eq("status", "approved"),
    )
    .collect();

  return requests.some((r) => {
    if (r.studentId !== studentId) return false;
    if (r.startDate > referenceDate) return false;
    if (r.endDate && r.endDate < referenceDate) return false;
    return true;
  });
}

async function buildClassLine(
  ctx: QueryCtx,
  studentId: Id<"students">,
  classId: Id<"classes">,
  referenceDate: string,
): Promise<BreakdownLine | null> {
  const cls = await ctx.db.get(classId);
  if (!cls || !cls.active) return null;

  const [startH, startM] = cls.startTime.split(":").map(Number);
  const [endH, endM] = cls.endTime.split(":").map(Number);
  const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (durationMinutes <= 0) return null;

  const assignments = await ctx.db
    .query("classAssignments")
    .withIndex("by_class", (q) => q.eq("classId", cls._id))
    .collect();
  const activeAssignment = assignments.find((a) => a.active);
  if (!activeAssignment) return null;

  const tutor = await ctx.db.get(activeAssignment.tutorId);
  if (!tutor) return null;

  const subjectRate = await ctx.db
    .query("subjectRates")
    .withIndex("by_tutor_and_subject", (q) =>
      q.eq("tutorId", tutor._id).eq("subject", cls.subject),
    )
    .first();

  const rateCents = subjectRate ? subjectRate.ratePerHour : tutor.hourlyRate;
  const paused = await isClassPausedForStudent(ctx, studentId, cls._id, referenceDate);
  const lineTotalCents = paused ? 0 : Math.round((durationMinutes / 60) * rateCents);

  return {
    className: cls.name,
    classId: cls._id,
    subject: cls.subject,
    dayOfWeek: cls.dayOfWeek,
    startTime: cls.startTime,
    endTime: cls.endTime,
    durationMinutes,
    tutorName: tutor.name,
    rateCents,
    lineTotalCents,
    paused,
  };
}

/** Full weekly breakdown -- all enrolled classes across all days. */
export async function calculateWeeklyRateHelper(
  ctx: QueryCtx,
  studentId: Id<"students">,
): Promise<WeeklyRate> {
  const enrollments = await ctx.db
    .query("classStudents")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .collect();
  const activeEnrollments = enrollments.filter((e) => e.active);

  const referenceDate = getTodayAdelaide();
  const breakdown: BreakdownLine[] = [];
  let totalCents = 0;

  for (const enrollment of activeEnrollments) {
    const line = await buildClassLine(ctx, studentId, enrollment.classId, referenceDate);
    if (!line) continue;
    breakdown.push(line);
    totalCents += line.lineTotalCents;
  }

  breakdown.sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return { totalCents, breakdown };
}

export const calculateWeeklyRate = internalQuery({
  args: { studentId: v.id("students") },
  returns: weeklyRateValidator,
  handler: async (ctx, { studentId }) => {
    return await calculateWeeklyRateHelper(ctx, studentId);
  },
});

/** Daily rate -- only classes on the given dayOfWeek. Used by the daily cron. */
export async function calculateDailyRateHelper(
  ctx: QueryCtx,
  studentId: Id<"students">,
  dayOfWeek: string,
  referenceDate: string,
): Promise<WeeklyRate> {
  const enrollments = await ctx.db
    .query("classStudents")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .collect();
  const activeEnrollments = enrollments.filter((e) => e.active);

  const breakdown: BreakdownLine[] = [];
  let totalCents = 0;

  for (const enrollment of activeEnrollments) {
    const cls = await ctx.db.get(enrollment.classId);
    if (!cls || !cls.active || cls.dayOfWeek !== dayOfWeek) continue;

    const line = await buildClassLine(ctx, studentId, enrollment.classId, referenceDate);
    if (!line) continue;
    breakdown.push(line);
    totalCents += line.lineTotalCents;
  }

  return { totalCents, breakdown };
}

export const calculateDailyRate = internalQuery({
  args: {
    studentId: v.id("students"),
    dayOfWeek: v.string(),
    referenceDate: v.string(),
  },
  returns: weeklyRateValidator,
  handler: async (ctx, { studentId, dayOfWeek, referenceDate }) => {
    return await calculateDailyRateHelper(ctx, studentId, dayOfWeek, referenceDate);
  },
});

// ---------------------------------------------------------------------------
// Billing profile queries / mutations
// ---------------------------------------------------------------------------

export const getBillingProfile = query({
  args: { studentId: v.id("students") },
  returns: v.union(
    v.object({
      _id: v.id("billingProfiles"),
      studentId: v.id("students"),
      paymentType: v.string(),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentMethodId: v.optional(v.string()),
      cardLast4: v.optional(v.string()),
      cardBrand: v.optional(v.string()),
      status: v.string(),
      createdAt: v.number(),
      weeklyRate: weeklyRateValidator,
      creditBalanceCents: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { studentId }) => {
    const profile = await ctx.db
      .query("billingProfiles")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .first();
    if (!profile) return null;

    const weeklyRate = await calculateWeeklyRateHelper(ctx, studentId);
    const creditBalanceCents = await getCreditBalanceHelper(ctx, studentId);

    return {
      _id: profile._id,
      studentId: profile.studentId,
      paymentType: profile.paymentType,
      stripeCustomerId: profile.stripeCustomerId,
      stripePaymentMethodId: profile.stripePaymentMethodId,
      cardLast4: profile.cardLast4,
      cardBrand: profile.cardBrand,
      status: profile.status,
      createdAt: profile.createdAt,
      weeklyRate,
      creditBalanceCents,
    };
  },
});

export const listAllBillingProfiles = query({
  args: { adminId: v.id("tutorAccounts") },
  returns: v.array(
    v.object({
      _id: v.id("billingProfiles"),
      studentId: v.id("students"),
      studentName: v.string(),
      paymentType: v.string(),
      cardLast4: v.optional(v.string()),
      cardBrand: v.optional(v.string()),
      status: v.string(),
      weeklyRateCents: v.number(),
      creditBalanceCents: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, { adminId }) => {
    await assertAdmin(ctx, adminId);

    const profiles = await ctx.db.query("billingProfiles").collect();

    const results = await Promise.all(
      profiles.map(async (profile) => {
        const student = await ctx.db.get(profile.studentId);
        const weeklyRate = await calculateWeeklyRateHelper(ctx, profile.studentId);
        const creditBalanceCents = await getCreditBalanceHelper(ctx, profile.studentId);
        return {
          _id: profile._id,
          studentId: profile.studentId,
          studentName: student?.name ?? "Unknown",
          paymentType: profile.paymentType,
          cardLast4: profile.cardLast4,
          cardBrand: profile.cardBrand,
          status: profile.status,
          weeklyRateCents: weeklyRate.totalCents,
          creditBalanceCents,
          createdAt: profile.createdAt,
        };
      }),
    );

    return results;
  },
});

export const createBillingProfile = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    paymentType: v.string(),
  },
  returns: v.id("billingProfiles"),
  handler: async (ctx, { adminId, studentId, paymentType }) => {
    await assertAdmin(ctx, adminId);

    const existing = await ctx.db
      .query("billingProfiles")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .first();
    if (existing) {
      throw new Error("Student already has a billing profile");
    }

    return await ctx.db.insert("billingProfiles", {
      studentId,
      paymentType,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const updatePaymentType = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    paymentType: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, studentId, paymentType }) => {
    await assertAdmin(ctx, adminId);

    const profile = await ctx.db
      .query("billingProfiles")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .first();
    if (!profile) return false;

    await ctx.db.patch(profile._id, { paymentType });
    return true;
  },
});

// ---------------------------------------------------------------------------
// Charge history
// ---------------------------------------------------------------------------

export const getChargeHistory = query({
  args: {
    studentId: v.id("students"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("billingCharges"),
      amountCents: v.number(),
      status: v.string(),
      weekStartDate: v.string(),
      stripePaymentIntentId: v.optional(v.string()),
      failureReason: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, { studentId, limit }) => {
    const charges = await ctx.db
      .query("billingCharges")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(limit ?? 50);

    return charges.map((c) => ({
      _id: c._id,
      amountCents: c.amountCents,
      status: c.status,
      weekStartDate: c.weekStartDate,
      stripePaymentIntentId: c.stripePaymentIntentId,
      failureReason: c.failureReason,
      createdAt: c.createdAt,
    }));
  },
});

export const getChargeHistoryAdmin = query({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
  },
  returns: v.array(
    v.object({
      _id: v.id("billingCharges"),
      amountCents: v.number(),
      status: v.string(),
      weekStartDate: v.string(),
      stripePaymentIntentId: v.optional(v.string()),
      failureReason: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, { adminId, studentId }) => {
    await assertAdmin(ctx, adminId);
    const charges = await ctx.db
      .query("billingCharges")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(50);

    return charges.map((c) => ({
      _id: c._id,
      amountCents: c.amountCents,
      status: c.status,
      weekStartDate: c.weekStartDate,
      stripePaymentIntentId: c.stripePaymentIntentId,
      failureReason: c.failureReason,
      createdAt: c.createdAt,
    }));
  },
});

// ---------------------------------------------------------------------------
// Pause requests (per-class)
// ---------------------------------------------------------------------------

export const requestClassPause = mutation({
  args: {
    studentId: v.id("students"),
    classId: v.id("classes"),
    reason: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
  },
  returns: v.id("pauseRequests"),
  handler: async (ctx, { studentId, classId, reason, startDate, endDate }) => {
    const enrollment = await ctx.db
      .query("classStudents")
      .withIndex("by_student_and_class", (q) =>
        q.eq("studentId", studentId).eq("classId", classId),
      )
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    if (!enrollment) throw new Error("Student is not enrolled in this class");

    const existing = await ctx.db
      .query("pauseRequests")
      .withIndex("by_class_and_status", (q) =>
        q.eq("classId", classId).eq("status", "pending"),
      )
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .first();
    if (existing) throw new Error("A pending pause request already exists for this class");

    return await ctx.db.insert("pauseRequests", {
      studentId,
      classId,
      reason,
      startDate,
      endDate,
      status: "pending",
      requestedAt: Date.now(),
    });
  },
});

export const reviewPauseRequest = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    requestId: v.id("pauseRequests"),
    decision: v.string(), // "approved" | "rejected"
    reviewNote: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, { adminId, requestId, decision, reviewNote }) => {
    await assertAdmin(ctx, adminId);
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") return false;

    await ctx.db.patch(requestId, {
      status: decision,
      reviewedBy: adminId,
      reviewedAt: Date.now(),
      reviewNote,
    });
    return true;
  },
});

export const cancelPauseRequest = mutation({
  args: {
    studentId: v.id("students"),
    requestId: v.id("pauseRequests"),
  },
  returns: v.boolean(),
  handler: async (ctx, { studentId, requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request || request.studentId !== studentId) return false;
    if (request.status !== "pending" && request.status !== "approved") return false;

    await ctx.db.patch(requestId, { status: "expired" });
    return true;
  },
});

export const listPauseRequests = query({
  args: { adminId: v.id("tutorAccounts") },
  returns: v.array(
    v.object({
      _id: v.id("pauseRequests"),
      studentId: v.id("students"),
      studentName: v.string(),
      classId: v.id("classes"),
      className: v.string(),
      reason: v.string(),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      status: v.string(),
      requestedAt: v.number(),
      reviewedBy: v.optional(v.id("tutorAccounts")),
      reviewedAt: v.optional(v.number()),
      reviewNote: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { adminId }) => {
    await assertAdmin(ctx, adminId);
    const requests = await ctx.db.query("pauseRequests").order("desc").collect();

    return Promise.all(
      requests.map(async (r) => {
        const student = await ctx.db.get(r.studentId);
        const cls = await ctx.db.get(r.classId);
        return {
          _id: r._id,
          studentId: r.studentId,
          studentName: student?.name ?? "Unknown",
          classId: r.classId,
          className: cls?.name ?? "Unknown",
          reason: r.reason,
          startDate: r.startDate,
          endDate: r.endDate,
          status: r.status,
          requestedAt: r.requestedAt,
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt,
          reviewNote: r.reviewNote,
        };
      }),
    );
  },
});

export const getMyPauseRequests = query({
  args: { studentId: v.id("students") },
  returns: v.array(
    v.object({
      _id: v.id("pauseRequests"),
      classId: v.id("classes"),
      className: v.string(),
      reason: v.string(),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      status: v.string(),
      requestedAt: v.number(),
      reviewNote: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { studentId }) => {
    const requests = await ctx.db
      .query("pauseRequests")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .collect();

    return Promise.all(
      requests.map(async (r) => {
        const cls = await ctx.db.get(r.classId);
        return {
          _id: r._id,
          classId: r.classId,
          className: cls?.name ?? "Unknown",
          reason: r.reason,
          startDate: r.startDate,
          endDate: r.endDate,
          status: r.status,
          requestedAt: r.requestedAt,
          reviewNote: r.reviewNote,
        };
      }),
    );
  },
});

// ---------------------------------------------------------------------------
// Credit system
// ---------------------------------------------------------------------------

async function getCreditBalanceHelper(
  ctx: QueryCtx,
  studentId: Id<"students">,
): Promise<number> {
  const credits = await ctx.db
    .query("billingCredits")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .collect();
  return credits.reduce((sum, c) => sum + c.amountCents, 0);
}

export const getStudentCreditBalance = query({
  args: { studentId: v.id("students") },
  returns: v.number(),
  handler: async (ctx, { studentId }) => {
    return await getCreditBalanceHelper(ctx, studentId);
  },
});

export const getCreditHistory = query({
  args: { studentId: v.id("students") },
  returns: v.array(
    v.object({
      _id: v.id("billingCredits"),
      amountCents: v.number(),
      reason: v.string(),
      description: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, { studentId }) => {
    const credits = await ctx.db
      .query("billingCredits")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .collect();

    return credits.map((c) => ({
      _id: c._id,
      amountCents: c.amountCents,
      reason: c.reason,
      description: c.description,
      createdAt: c.createdAt,
    }));
  },
});

export const getCreditHistoryAdmin = query({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
  },
  returns: v.array(
    v.object({
      _id: v.id("billingCredits"),
      amountCents: v.number(),
      reason: v.string(),
      description: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, { adminId, studentId }) => {
    await assertAdmin(ctx, adminId);
    const credits = await ctx.db
      .query("billingCredits")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .collect();

    return credits.map((c) => ({
      _id: c._id,
      amountCents: c.amountCents,
      reason: c.reason,
      description: c.description,
      createdAt: c.createdAt,
    }));
  },
});

export const addCredit = mutation({
  args: {
    adminId: v.id("tutorAccounts"),
    studentId: v.id("students"),
    amountCents: v.number(),
    description: v.string(),
  },
  returns: v.id("billingCredits"),
  handler: async (ctx, { adminId, studentId, amountCents, description }) => {
    await assertAdmin(ctx, adminId);
    if (amountCents <= 0) throw new Error("Credit amount must be positive");

    return await ctx.db.insert("billingCredits", {
      studentId,
      amountCents,
      reason: "admin_manual",
      description,
      createdBy: adminId,
      createdAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Internal helpers used by stripeActions.ts
// ---------------------------------------------------------------------------

export const getBillingProfileInternal = internalQuery({
  args: { studentId: v.id("students") },
  returns: v.union(
    v.object({
      _id: v.id("billingProfiles"),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentMethodId: v.optional(v.string()),
      paymentType: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { studentId }) => {
    const profile = await ctx.db
      .query("billingProfiles")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .first();
    if (!profile) return null;
    return {
      _id: profile._id,
      stripeCustomerId: profile.stripeCustomerId,
      stripePaymentMethodId: profile.stripePaymentMethodId,
      paymentType: profile.paymentType,
    };
  },
});

export const getStudentInternal = internalQuery({
  args: { studentId: v.id("students") },
  returns: v.union(
    v.object({
      name: v.string(),
      email: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, { studentId }) => {
    const student = await ctx.db.get(studentId);
    if (!student) return null;
    return { name: student.name, email: student.email };
  },
});

export const listActiveBillingProfiles = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("billingProfiles"),
      studentId: v.id("students"),
      paymentType: v.string(),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentMethodId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("billingProfiles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return profiles.map((p) => ({
      _id: p._id,
      studentId: p.studentId,
      paymentType: p.paymentType,
      stripeCustomerId: p.stripeCustomerId,
      stripePaymentMethodId: p.stripePaymentMethodId,
    }));
  },
});

export const updateBillingProfileStripeCustomer = internalMutation({
  args: {
    billingProfileId: v.id("billingProfiles"),
    stripeCustomerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { billingProfileId, stripeCustomerId }) => {
    await ctx.db.patch(billingProfileId, { stripeCustomerId });
    return null;
  },
});

export const updateBillingProfilePaymentMethod = internalMutation({
  args: {
    studentId: v.id("students"),
    stripePaymentMethodId: v.string(),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { studentId, stripePaymentMethodId, cardLast4, cardBrand }) => {
    const profile = await ctx.db
      .query("billingProfiles")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .first();
    if (!profile) throw new Error("Billing profile not found");

    await ctx.db.patch(profile._id, {
      stripePaymentMethodId,
      cardLast4,
      cardBrand,
    });
    return null;
  },
});

export const recordCharge = internalMutation({
  args: {
    studentId: v.id("students"),
    billingProfileId: v.id("billingProfiles"),
    amountCents: v.number(),
    status: v.string(),
    weekStartDate: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("billingCharges", {
      studentId: args.studentId,
      billingProfileId: args.billingProfileId,
      amountCents: args.amountCents,
      status: args.status,
      weekStartDate: args.weekStartDate,
      stripePaymentIntentId: args.stripePaymentIntentId,
      failureReason: args.failureReason,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const getCreditBalanceInternal = internalQuery({
  args: { studentId: v.id("students") },
  returns: v.number(),
  handler: async (ctx, { studentId }) => {
    return await getCreditBalanceHelper(ctx, studentId);
  },
});

export const insertCreditEntry = internalMutation({
  args: {
    studentId: v.id("students"),
    amountCents: v.number(),
    reason: v.string(),
    description: v.string(),
    billingChargeId: v.optional(v.id("billingCharges")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("billingCredits", {
      studentId: args.studentId,
      amountCents: args.amountCents,
      reason: args.reason,
      description: args.description,
      billingChargeId: args.billingChargeId,
      createdAt: Date.now(),
    });
    return null;
  },
});
