import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import type { FunctionReturnType } from "convex/server";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { adelaideTimestamp } from "../lib/adelaideDate";

const modules = import.meta.glob("../convex/**/*.{ts,js}");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const adminId = await ctx.db.insert("tutorAccounts", { name: "Admin", email: "admin@example.com", passwordHash: "secret-fixture", hourlyRate: 3000, active: true, roles: ["admin"] });
    const studentId = await ctx.db.insert("students", { name: "Student", yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
    const profileId = await ctx.db.insert("billingProfiles", { studentId, paymentType: "card", status: "active", createdAt: Date.now() });
    return { adminId, studentId, profileId };
  });
  const admin = t.withIdentity({ subject: ids.adminId, type: "admin", tutorAccountId: ids.adminId, roles: ["admin"] });
  return { t, admin, ...ids };
}
const paginationOpts = { numItems: 50, cursor: null };

describe("paginated admin data and revenue", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-26T05:00:00Z")); });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

  it("walks every student page without duplicates and omits password hashes from tutor rows", async () => {
    const { t, admin, adminId } = await setup();
    await t.run(async ctx => {
      for (let i = 0; i < 124; i++) await ctx.db.insert("students", { name: `Student ${i}`, yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
    });
    const ids: string[] = [];
    let cursor: string | null = null;
    for (;;) {
      const page: FunctionReturnType<typeof api.adminLists.students> = await admin.query(api.adminLists.students, { adminId, paginationOpts: { numItems: 50, cursor } });
      expect(page.page.length).toBeLessThanOrEqual(50);
      ids.push(...page.page.map(s => s._id));
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    expect(ids).toHaveLength(125);
    expect(new Set(ids).size).toBe(125);
    const tutors = await admin.query(api.adminLists.tutors, { adminId, paginationOpts });
    expect(tutors.page[0]).not.toHaveProperty("passwordHash");
  });

  it("preserves the cursor when a selector page contains no eligible students", async () => {
    const { t, admin, adminId } = await setup();
    const eligibleId = await t.run(ctx => ctx.db.insert("students", { name: "Eligible", yearLevel: "Year 11", subjects: [], active: true, createdAt: Date.now() }));
    const first = await admin.query(api.adminLists.studentsWithoutBilling, { adminId, paginationOpts: { numItems: 1, cursor: null } });
    expect(first.page).toHaveLength(0);
    expect(first.isDone).toBe(false);
    const second = await admin.query(api.adminLists.studentsWithoutBilling, { adminId, paginationOpts: { numItems: 1, cursor: first.continueCursor } });
    expect(second.page.map(s => s._id)).toEqual([eligibleId]);
  });

  it("includes weekly students beyond the first forecast page and prepares their evening review", async () => {
    vi.setSystemTime(adelaideTimestamp("2026-10-31", "12:00"));
    const { t, admin, adminId } = await setup();
    await t.run(async ctx => {
      for (let position = 2; position <= 16; position++) {
        const name = position === 13 ? "Grace Dolman" : position === 16 ? "Anna Kwon" : `Student ${position}`;
        const studentId = await ctx.db.insert("students", { name, yearLevel: "11", subjects: [], active: true, createdAt: Date.now() });
        await ctx.db.insert("billingProfiles", { studentId, paymentType: "card", status: "active", stripePaymentMethodId: "pm_fixture", createdAt: Date.now() });
        if (position !== 13 && position !== 16) continue;
        const classId = await ctx.db.insert("classes", {
          name: "Weekly maths", subject: "Maths", yearLevel: "11", active: true, createdAt: Date.now(),
          dayOfWeek: position === 13 ? "Tuesday" : "Sunday", startTime: position === 13 ? "17:30" : "16:00",
          endTime: position === 13 ? "18:30" : "17:00", hourlyRateCents: position === 13 ? 5500 : 6000,
        });
        await ctx.db.insert("classStudents", { studentId, classId, active: true, assignedAt: Date.now() });
      }
    });
    const first = await admin.query(api.adminLists.upcomingCharges, { adminId, paginationOpts: { numItems: 10, cursor: null } });
    expect(first.isDone).toBe(false);
    expect(first.page.flatMap(p => p.charges)).toHaveLength(0);
    const second = await admin.query(api.adminLists.upcomingCharges, { adminId, paginationOpts: { numItems: 10, cursor: first.continueCursor } });
    expect(second.isDone).toBe(true);
    const charges = second.page.flatMap(p => p.charges);
    expect(charges.filter(c => c.studentName === "Anna Kwon").map(c => [c.date, c.netChargeCents])).toEqual([
      ["2026-11-01", 6000], ["2026-11-08", 6000], ["2026-11-15", 6000], ["2026-11-22", 6000],
    ]);
    expect(charges.filter(c => c.studentName === "Grace Dolman").map(c => [c.date, c.netChargeCents])).toEqual([
      ["2026-11-03", 5500], ["2026-11-10", 5500], ["2026-11-17", 5500], ["2026-11-24", 5500],
    ]);
    for (const [date, name] of [["2026-11-01", "Anna Kwon"], ["2026-11-03", "Grace Dolman"]]) {
      vi.setSystemTime(adelaideTimestamp(date, "18:00"));
      await t.mutation(internal.billingReview.tick, {});
      const day = await t.run(ctx => ctx.db.query("billingReviewDays").withIndex("by_date", q => q.eq("date", date)).unique());
      await t.mutation(internal.billingReview.preparePage, { dayId: day!._id });
      const review = await admin.query(api.billingReview.lessons, { date, paginationOpts });
      expect(review.page).toHaveLength(1);
      expect(review.page[0]).toMatchObject({ studentName: name, status: "pending" });
      if (name === "Grace Dolman") {
        const reviews = [{ id: review.page[0]._id, version: review.page[0].version }];
        await expect(admin.mutation(api.billingReview.approve, { reviews })).rejects.toThrow(/finished/);
        vi.setSystemTime(adelaideTimestamp(date, "18:30"));
        await admin.mutation(api.billingReview.approve, { reviews });
      }
    }
  });

  it("applies enquiry type and sort before pagination", async () => {
    const { t, admin, adminId } = await setup();
    await t.run(async ctx => {
      for (let i = 0; i < 12; i++) await ctx.db.insert("enquiries", { type: i % 2 ? "tutor" : "student", name: `Name ${i}`, email: "test@example.com", yearLevel: "12", subjects: "", message: "", createdAt: i });
    });
    const first = await admin.query(api.adminLists.enquiries, { adminId, type: "tutor", order: "asc", paginationOpts: { numItems: 3, cursor: null } });
    expect(first.page.map(e => e.createdAt)).toEqual([1, 3, 5]);
    const second = await admin.query(api.adminLists.enquiries, { adminId, type: "tutor", order: "asc", paginationOpts: { numItems: 3, cursor: first.continueCursor } });
    expect(second.page.map(e => e.createdAt)).toEqual([7, 9, 11]);
  });

  it("joins session names and filters the indexed date range", async () => {
    const { t, admin, adminId, studentId } = await setup();
    await t.run(async ctx => {
      for (const date of ["2026-10-01", "2026-10-26", "2026-11-01"]) await ctx.db.insert("sessions", { date, tutorId: adminId, studentId, durationMinutes: 90, subject: "English", ratePerHour: 3000, createdAt: Date.now() });
    });
    const page = await admin.query(api.adminLists.sessions, { adminId, startDate: "2026-10-26", endDate: "2026-10-26", paginationOpts });
    expect(page.page).toHaveLength(1);
    expect(page.page[0]).toMatchObject({ tutorName: "Admin", studentName: "Student", earnings: 4500 });
  });

  it("requires a current admin identity for every new list and aggregate", async () => {
    const { t, admin, adminId } = await setup();
    const queries = [api.adminLists.students, api.adminLists.tutors, api.adminLists.billingProfiles, api.adminLists.chargeHistory, api.adminLists.pauseRequests, api.adminLists.upcomingCharges, api.adminLists.studentsWithoutBilling];
    for (const query of queries) await expect(t.query(query, { adminId, paginationOpts })).rejects.toThrow();
    await expect(t.query(api.billingRevenue.stats, {})).rejects.toThrow();
    await expect(t.mutation(api.billingRevenue.ensure, {})).rejects.toThrow();
    await t.run(ctx => ctx.db.patch(adminId, { active: false }));
    await expect(admin.query(api.adminLists.students, { adminId, paginationOpts })).rejects.toThrow();
    await expect(admin.query(api.billingRevenue.chart, { paginationOpts })).rejects.toThrow();
  });

  it("backfills in batches and overlaps live writes without partial totals or double counting", async () => {
    const { t, admin, studentId, profileId } = await setup();
    await t.run(async ctx => {
      for (let i = 0; i < 210; i++) await ctx.db.insert("billingCharges", {
        studentId, billingProfileId: profileId, amountCents: 100, status: "succeeded",
        weekStartDate: "2026-10-26", createdAt: Date.now(),
      });
      await ctx.db.insert("billingCharges", { studentId, billingProfileId: profileId, amountCents: 9000, status: "failed", weekStartDate: "2026-10-26", createdAt: Date.now() });
    });
    await admin.mutation(api.billingRevenue.ensure, {});
    expect((await admin.query(api.billingRevenue.stats, {})).ready).toBe(false);
    await t.mutation(internal.billingRevenue.backfill, {});
    expect((await admin.query(api.billingRevenue.stats, {})).ready).toBe(false);
    await t.mutation(internal.billing.recordCharge, { studentId, billingProfileId: profileId, amountCents: 700, status: "succeeded", weekStartDate: "2026-10-26" });
    await t.mutation(internal.billingRevenue.backfill, {});
    await t.mutation(internal.billingRevenue.backfill, {});
    await t.mutation(internal.billingRevenue.backfill, {});
    expect(await admin.query(api.billingRevenue.stats, {})).toEqual({ ready: true, allTimeCents: 21700, thisMonthCents: 21700, thisWeekCents: 21700, chargeCount: 211, legacyChargeCount: 211 });
    const chart = await admin.query(api.billingRevenue.chart, { paginationOpts });
    expect(chart.page).toHaveLength(1);
    expect(chart.page[0].totalCents).toBe(21700);
    expect(await t.run(ctx => ctx.db.query("billingRevenueContributions").collect())).toHaveLength(211);
  });

  it("counts money received separately from credit in the revenue aggregate", async () => {
    const { t, admin, studentId, profileId } = await setup();
    const operationId = await t.run(ctx => ctx.db.insert("billingOperations", { key: "test-credit", source: "daily", status: "pending", studentId, billingProfileId: profileId, amountCents: 3000, creditCents: 1000, chargeCents: 2000, paymentType: "card", description: "Lesson", chargeDate: "2026-10-26", attempts: 0, leaseUntil: 0, createdAt: Date.now(), updatedAt: Date.now() }));
    await t.mutation(internal.billingOperations.finish, { operationId, status: "succeeded", paymentIntentId: "pi_fixture" });
    await t.mutation(internal.billingRevenue.backfill, {});
    expect((await admin.query(api.billingRevenue.stats, {})).allTimeCents).toBe(2000);
  });
});
