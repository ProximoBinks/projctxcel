import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./identity";
import { studentAdminRow } from "./admin";
import { billingProfileRow, upcomingForProfile } from "./billing";

const args = { adminId: v.id("tutorAccounts"), paginationOpts: paginationOptsValidator };

export const tutors = query({
  args,
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("tutorAccounts").order("desc").paginate(paginationOpts);
    return { ...page, page: page.page.map(t => ({ _id: t._id, email: t.email, name: t.name, tutorSlug: t.tutorSlug, hourlyRate: t.hourlyRate, active: t.active, roles: t.roles ?? ["tutor"] })) };
  },
});

export const students = query({
  args,
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("students").order("desc").paginate(paginationOpts);
    return { ...page, page: await Promise.all(page.page.map(s => studentAdminRow(ctx, s))) };
  },
});

export const studentsWithoutBilling = query({
  args,
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("students").withIndex("by_active", q => q.eq("active", true)).paginate(paginationOpts);
    const eligible = await Promise.all(page.page.map(async s => {
      const profile = await ctx.db.query("billingProfiles").withIndex("by_studentId", q => q.eq("studentId", s._id)).first();
      return profile ? null : { _id: s._id, name: s.name };
    }));
    return { ...page, page: eligible.filter(s => s !== null) };
  },
});

export const enquiries = query({
  args: { ...args, type: v.optional(v.string()), order: v.union(v.literal("asc"), v.literal("desc")) },
  handler: async (ctx, { paginationOpts, type, order }) => {
    await requireAdmin(ctx);
    const rows = type
      ? ctx.db.query("enquiries").withIndex("by_type_createdAt", q => q.eq("type", type))
      : ctx.db.query("enquiries").withIndex("by_createdAt");
    return await rows.order(order).paginate(paginationOpts);
  },
});

export const sessions = query({
  args: { ...args, startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { paginationOpts, startDate, endDate }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("sessions").withIndex("by_date", q => q.gte("date", startDate).lte("date", endDate)).order("desc").paginate(paginationOpts);
    return { ...page, page: await Promise.all(page.page.map(async s => ({
      ...s, tutorName: (await ctx.db.get(s.tutorId))?.name ?? "Unknown", studentName: (await ctx.db.get(s.studentId))?.name ?? "Unknown",
      earnings: Math.round(s.durationMinutes / 60 * s.ratePerHour),
    }))) };
  },
});

export const billingProfiles = query({
  args,
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("billingProfiles").order("desc").paginate(paginationOpts);
    return { ...page, page: await Promise.all(page.page.map(p => billingProfileRow(ctx, p))) };
  },
});

export const chargeHistory = query({
  args: { ...args, studentId: v.optional(v.id("students")) },
  handler: async (ctx, { paginationOpts, studentId }) => {
    await requireAdmin(ctx);
    const rows = studentId ? ctx.db.query("billingCharges").withIndex("by_student", q => q.eq("studentId", studentId)) : ctx.db.query("billingCharges");
    const page = await rows.order("desc").paginate(paginationOpts);
    return { ...page, page: await Promise.all(page.page.map(async charge => ({ ...charge, studentName: (await ctx.db.get(charge.studentId))?.name ?? "Unknown" }))) };
  },
});

export const pauseRequests = query({
  args,
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("pauseRequests").order("desc").paginate(paginationOpts);
    return { ...page, page: await Promise.all(page.page.map(async r => ({ ...r, studentName: (await ctx.db.get(r.studentId))?.name ?? "Unknown", className: (await ctx.db.get(r.classId))?.name ?? "Unknown" }))) };
  },
});

export const upcomingCharges = query({
  args,
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("billingProfiles").withIndex("by_status", q => q.eq("status", "active")).paginate(paginationOpts);
    // One page item per profile: the UI flattens its dates without corrupting cursor boundaries.
    return { ...page, page: await Promise.all(page.page.map(async profile => ({ profileId: profile._id, charges: await upcomingForProfile(ctx, profile) }))) };
  },
});

export const creditHistory = query({
  args: { ...args, studentId: v.id("students") },
  handler: async (ctx, { paginationOpts, studentId }) => {
    await requireAdmin(ctx);
    return await ctx.db.query("billingCredits").withIndex("by_student", q => q.eq("studentId", studentId)).order("desc").paginate(paginationOpts);
  },
});

export const unresolvedOperations = query({
  args: { ...args, status: v.union(v.literal("pending"), v.literal("uncertain")) },
  handler: async (ctx, { paginationOpts, status }) => {
    await requireAdmin(ctx);
    const page = await ctx.db.query("billingOperations").withIndex("by_status", q => q.eq("status", status)).order("desc").paginate(paginationOpts);
    return { ...page, page: await Promise.all(page.page.map(async op => ({
      _id: op._id, status: op.status, description: op.description, amountCents: op.amountCents, error: op.error,
      studentName: (await ctx.db.get(op.studentId))?.name ?? "Unknown",
    }))) };
  },
});
