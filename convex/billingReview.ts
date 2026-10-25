import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation, internalMutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAdmin } from "./identity";
import { validCents, validDate } from "./adminValidation";
import { calculateDailyRateHelper, getCreditBalanceHelper } from "./billing";
import { insertOperation } from "./billingOperations";
import { queueSummary } from "./billingReviewNotifications";
import { adelaideDate, adelaideTime, adelaideTimestamp, adelaideWeekday } from "../lib/adelaideDate";

type Review = Doc<"billingReviews">;
type Line = Awaited<ReturnType<typeof calculateDailyRateHelper>>["breakdown"][number];
const countKey = { pending: "pendingCount", approved: "approvedCount", held: "heldCount", submitted: "submittedCount" } as const;
const fingerprint = (line: Line) => JSON.stringify(line);
const weekday = (date: string) => adelaideWeekday(new Date(`${date}T12:00:00Z`));

async function updateRow(ctx: MutationCtx, row: Review, changes: Partial<Review>) {
  const next = { ...row, ...changes };
  const day = (await ctx.db.get(row.dayId))!;
  const counts = { pendingCount: day.pendingCount, approvedCount: day.approvedCount, heldCount: day.heldCount, submittedCount: day.submittedCount };
  counts[countKey[row.status]]--;
  counts[countKey[next.status]]++;
  await ctx.db.patch(day._id, {
    ...counts,
    totalCents: day.totalCents + next.amountCents - row.amountCents,
    approvedCents: day.approvedCents - (row.status === "approved" ? row.amountCents : 0) + (next.status === "approved" ? next.amountCents : 0),
    updatedAt: Date.now(),
  });
  await ctx.db.patch(row._id, { ...changes, version: row.version + 1, updatedAt: Date.now() });
}

async function ensureDay(ctx: MutationCtx, date: string) {
  const existing = await ctx.db.query("billingReviewDays").withIndex("by_date", q => q.eq("date", date)).unique();
  if (existing) return existing._id;
  const id = await ctx.db.insert("billingReviewDays", {
    date, status: "preparing", cursor: null, lessonCount: 0, pendingCount: 0, approvedCount: 0,
    heldCount: 0, submittedCount: 0, totalCents: 0, approvedCents: 0, createdAt: Date.now(), updatedAt: Date.now(),
  });
  await ctx.scheduler.runAfter(0, internal.billingReview.preparePage, { dayId: id });
  return id;
}

async function oldDailyOperation(ctx: QueryCtx, profileId: Id<"billingProfiles">, date: string) {
  const op = await ctx.db.query("billingOperations").withIndex("by_key", q => q.eq("key", `daily:${profileId}:${date}`)).unique();
  const charge = await ctx.db.query("billingCharges").withIndex("by_billingProfile_and_week", q => q.eq("billingProfileId", profileId).eq("weekStartDate", date))
    .filter(q => q.eq(q.field("operationId"), undefined)).first();
  return Boolean(op || charge);
}

async function currentLine(ctx: QueryCtx, row: Review) {
  const profile = await ctx.db.get(row.billingProfileId);
  const student = await ctx.db.get(row.studentId);
  if (!profile || profile.status !== "active" || !student?.active) return null;
  const rate = await calculateDailyRateHelper(ctx, row.studentId, weekday(row.date), row.date);
  return rate.breakdown.find(line => line.classId === row.classId && !line.paused && line.lineTotalCents > 0) ?? null;
}

async function validateApproval(ctx: MutationCtx, row: Review) {
  if (row.status === "submitted") throw new ConvexError("This lesson has already been submitted for payment.");
  if (Date.now() < adelaideTimestamp(row.date, row.endTime)) throw new ConvexError("Wait until the lesson has finished before approving it.");
  if (await oldDailyOperation(ctx, row.billingProfileId, row.date)) throw new ConvexError("This student/date was already handled by the previous billing system. Check charge history first.");
  const line = await currentLine(ctx, row);
  if (!line || fingerprint(line) !== row.fingerprint) throw new ConvexError("The class, rate, enrolment or pause status changed. Refresh today's review before approving.");
  validCents(row.amountCents, true);
}

export const prepareToday = mutation({
  args: {},
  handler: async ctx => {
    await requireAdmin(ctx);
    const id = await ensureDay(ctx, adelaideDate());
    const day = (await ctx.db.get(id))!;
    if (day.status === "ready") {
      await ctx.db.patch(id, { status: "preparing", cursor: null, updatedAt: Date.now() });
      await ctx.scheduler.runAfter(0, internal.billingReview.preparePage, { dayId: id });
    }
    return id;
  },
});

export const preparePage = internalMutation({
  args: { dayId: v.id("billingReviewDays") },
  handler: async (ctx, { dayId }): Promise<void> => {
    const day = await ctx.db.get(dayId);
    if (!day || day.status !== "preparing") return;
    const page = await ctx.db.query("billingProfiles").paginate({ numItems: 25, cursor: day.cursor });
    for (const profile of page.page) {
      const student = await ctx.db.get(profile.studentId);
      const rate = profile.status === "active" && student?.active
        ? await calculateDailyRateHelper(ctx, profile.studentId, weekday(day.date), day.date) : { breakdown: [] };
      const lines = rate.breakdown.filter(line => !line.paused && line.lineTotalCents > 0);
      const existing = await ctx.db.query("billingReviews").withIndex("by_profile_date", q => q.eq("billingProfileId", profile._id).eq("date", day.date)).collect();
      for (const row of existing) {
        if (row.status === "submitted") continue;
        const line = lines.find(line => line.classId === row.classId);
        if (!line) {
          await updateRow(ctx, row, { status: "held", autoChargeEligible: false, approvedBy: undefined, approvedAt: undefined, note: "No longer billable under the current schedule or pause settings." });
        } else if (row.fingerprint !== fingerprint(line)) {
          await updateRow(ctx, row, { ...snapshot(line), status: "pending", amountCents: line.lineTotalCents, adjustmentNote: undefined,
            autoChargeEligible: false, approvedBy: undefined, approvedAt: undefined, note: "Schedule or price changed. Review and approve again." });
        }
      }
      for (const line of lines) {
        if (existing.some(row => row.classId === line.classId)) continue;
        const alreadyHandled = await oldDailyOperation(ctx, profile._id, day.date);
        await ctx.db.insert("billingReviews", {
          dayId, date: day.date, billingProfileId: profile._id, studentId: profile.studentId, studentName: student!.name,
          ...snapshot(line), amountCents: line.lineTotalCents, version: 1, status: alreadyHandled ? "held" : "pending", autoChargeEligible: false,
          note: alreadyHandled ? "Previously billed or attempted for this date. Check history; automatic re-billing is blocked." : undefined,
          createdAt: Date.now(), updatedAt: Date.now(),
        });
        const current = (await ctx.db.get(dayId))!;
        await ctx.db.patch(dayId, { lessonCount: current.lessonCount + 1, pendingCount: current.pendingCount + (alreadyHandled ? 0 : 1), heldCount: current.heldCount + (alreadyHandled ? 1 : 0), totalCents: current.totalCents + line.lineTotalCents });
      }
    }
    await ctx.db.patch(dayId, { cursor: page.continueCursor, status: page.isDone ? "ready" : "preparing", updatedAt: Date.now() });
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.billingReview.preparePage, { dayId });
    else await queueSummary(ctx, dayId);
  },
});

function snapshot(line: Line) {
  return { classId: line.classId, className: line.className, subject: line.subject, tutorName: line.tutorName,
    startTime: line.startTime, endTime: line.endTime, scheduledCents: line.lineTotalCents, fingerprint: fingerprint(line) };
}

export const day = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    await requireAdmin(ctx); validDate(date);
    const summary = await ctx.db.query("billingReviewDays").withIndex("by_date", q => q.eq("date", date)).unique();
    return { summary, cutoffAt: adelaideTimestamp(date), now: Date.now(), today: adelaideDate() };
  },
});

export const lessons = query({
  args: { date: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { date, paginationOpts }) => {
    await requireAdmin(ctx); validDate(date);
    const summary = await ctx.db.query("billingReviewDays").withIndex("by_date", q => q.eq("date", date)).unique();
    if (!summary) return { page: [], isDone: true, continueCursor: "" };
    const result = await ctx.db.query("billingReviews").withIndex("by_day", q => q.eq("dayId", summary._id)).paginate(paginationOpts);
    return { ...result, page: await Promise.all(result.page.map(async row => {
      const op = row.operationId ? await latestOperation(ctx, row.operationId) : null;
      const profile = await ctx.db.get(row.billingProfileId);
      return { ...row, paymentType: op?.paymentType ?? profile?.paymentType ?? "unknown", hasCard: !!profile?.stripePaymentMethodId,
        operationStatus: op?.status, paymentError: op?.error, paidCents: op?.status === "succeeded" ? op.chargeCents : undefined };
    })) };
  },
});

async function latestOperation(ctx: QueryCtx, operationId: Id<"billingOperations">) {
  let operation = await ctx.db.get(operationId);
  const seen = new Set<string>();
  while (operation?.status === "failed" && operation.chargeId && seen.size < 20) {
    if (seen.has(operation._id)) break;
    seen.add(operation._id);
    const charge = await ctx.db.get(operation.chargeId);
    if (!charge?.retryOperationId) break;
    const retry = await ctx.db.get(charge.retryOperationId);
    if (!retry) break;
    operation = retry;
  }
  return operation;
}

export const edit = mutation({
  args: { reviewId: v.id("billingReviews"), version: v.number(), amountCents: v.number(), note: v.string(), hold: v.boolean() },
  handler: async (ctx, { reviewId, version, amountCents, note, hold }) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(reviewId);
    if (!row || row.version !== version) throw new ConvexError("This review changed. Reload it before saving.");
    if (row.status === "submitted") throw new ConvexError("A submitted payment cannot be edited here.");
    validCents(amountCents, true);
    if (amountCents !== row.scheduledCents && !note.trim()) throw new ConvexError("Add a reason for the adjusted amount.");
    await updateRow(ctx, row, { amountCents, adjustmentNote: note.trim() || undefined, status: hold ? "held" : "pending",
      note: hold ? "Held by an administrator." : undefined, autoChargeEligible: false, approvedBy: undefined, approvedAt: undefined });
  },
});

export const approve = mutation({
  args: { reviews: v.array(v.object({ id: v.id("billingReviews"), version: v.number() })) },
  handler: async (ctx, { reviews }) => {
    const adminId = await requireAdmin(ctx);
    if (reviews.length < 1 || reviews.length > 50 || new Set(reviews.map(row => row.id)).size !== reviews.length) throw new ConvexError("Select between 1 and 50 distinct lessons.");
    for (const selection of reviews) {
      const row = await ctx.db.get(selection.id);
      if (!row || row.version !== selection.version) throw new ConvexError("A selected lesson changed. Review the current amounts before approving.");
      if (row.status !== "pending") throw new ConvexError("Only lessons awaiting review can be approved.");
      const day = await ctx.db.get(row.dayId);
      if (day?.status !== "ready") throw new ConvexError("Wait until the summary finishes preparing.");
      await validateApproval(ctx, row);
      const profile = (await ctx.db.get(row.billingProfileId))!;
      await updateRow(ctx, row, { status: "approved", approvedBy: adminId, approvedAt: Date.now(), approvedPaymentType: profile.paymentType, note: undefined,
        autoChargeEligible: row.date === adelaideDate() && Date.now() < adelaideTimestamp(row.date) });
    }
  },
});

async function queueProfile(ctx: MutationCtx, dayId: Id<"billingReviewDays">, profileId: Id<"billingProfiles">, automatic: boolean, selectedIds?: Set<Id<"billingReviews">>) {
  const day = (await ctx.db.get(dayId))!;
  const rows = await ctx.db.query("billingReviews").withIndex("by_profile_date", q => q.eq("billingProfileId", profileId).eq("date", day.date)).collect();
  const approved = rows.filter(row => row.status === "approved" && (!automatic || row.autoChargeEligible) && (!selectedIds || selectedIds.has(row._id)));
  const valid: Review[] = [];
  for (const row of approved) {
    try {
      await validateApproval(ctx, row);
      const profile = await ctx.db.get(row.billingProfileId);
      if (row.approvedPaymentType !== profile?.paymentType) throw new Error("Payment type changed after approval. Review and approve again.");
      const approver = row.approvedBy ? await ctx.db.get(row.approvedBy) : null;
      if (!approver?.active || !approver.roles?.includes("admin")) throw new Error("The approving administrator no longer has access.");
      valid.push(row);
    } catch (error) {
      await updateRow(ctx, row, { status: "held", autoChargeEligible: false, note: error instanceof Error ? error.message : "Review this lesson again." });
    }
  }
  if (valid.length === 0) return;
  const profile = (await ctx.db.get(profileId))!;
  const student = (await ctx.db.get(profile.studentId))!;
  const amountCents = valid.reduce((sum, row) => sum + row.amountCents, 0);
  validCents(amountCents, true);
  const creditCents = Math.min(Math.max(0, await getCreditBalanceHelper(ctx, profile.studentId)), amountCents);
  const reviewIds = valid.map(row => row._id).sort();
  const operationId = await insertOperation(ctx, {
    key: `approved:${day.date}:${reviewIds[0]}`, source: "daily", reviewIds,
    studentId: student._id, billingProfileId: profileId, amountCents, creditCents, chargeCents: amountCents - creditCents,
    paymentType: profile.paymentType, stripeCustomerId: profile.stripeCustomerId, stripePaymentMethodId: profile.stripePaymentMethodId,
    receiptEmail: student.parentEmail || student.email || undefined,
    description: `Approved lessons ${day.date} — ${valid.map(row => row.className).join(", ")}`, chargeDate: day.date,
  });
  for (const row of valid) await updateRow(ctx, row, { status: "submitted", operationId, autoChargeEligible: false });
  await ctx.scheduler.runAfter(0, internal.stripeActions.processBillingOperation, { operationId });
}

export const dispatchPage = internalMutation({
  args: { dayId: v.id("billingReviewDays") },
  handler: async (ctx, { dayId }): Promise<void> => {
    const day = await ctx.db.get(dayId);
    if (!day || day.status !== "ready" || Date.now() < adelaideTimestamp(day.date) || day.autoFinishedAt) return;
    const eligible = await ctx.db.query("billingReviews").withIndex("by_day_status_auto", q => q.eq("dayId", dayId).eq("status", "approved").eq("autoChargeEligible", true)).take(25);
    for (const profileId of new Set(eligible.map(row => row.billingProfileId))) await queueProfile(ctx, dayId, profileId, true);
    if (eligible.length === 25) await ctx.scheduler.runAfter(0, internal.billingReview.dispatchPage, { dayId });
    else await ctx.db.patch(dayId, { autoFinishedAt: Date.now() });
  },
});

export const chargeApprovedNow = mutation({
  args: { dayId: v.id("billingReviewDays"), reviews: v.array(v.object({ id: v.id("billingReviews"), version: v.number() })) },
  handler: async (ctx, { dayId, reviews }) => {
    await requireAdmin(ctx);
    const day = await ctx.db.get(dayId);
    if (!day || day.status !== "ready") throw new ConvexError("Wait until the daily summary is ready.");
    if (Date.now() < adelaideTimestamp(day.date)) throw new ConvexError("Approved lessons are scheduled for 7pm Adelaide time.");
    if (reviews.length < 1 || reviews.length > 50) throw new ConvexError("Select between 1 and 50 approved lessons.");
    const profiles = new Set<Id<"billingProfiles">>();
    const ids = new Set<Id<"billingReviews">>();
    for (const selected of reviews) {
      const row = await ctx.db.get(selected.id);
      if (!row || row.dayId !== dayId) throw new ConvexError("Lesson does not belong to this daily review.");
      if (row.status === "submitted") continue;
      if (row.version !== selected.version || row.status !== "approved") throw new ConvexError("A selected lesson changed. Review it again before charging.");
      profiles.add(row.billingProfileId); ids.add(row._id);
    }
    for (const profileId of profiles) await queueProfile(ctx, dayId, profileId, false, ids);
  },
});

export const tick = internalMutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    if (adelaideTime() < "18:00") return;
    const dayId = await ensureDay(ctx, adelaideDate());
    const day = (await ctx.db.get(dayId))!;
    if (day.status === "preparing") await ctx.scheduler.runAfter(0, internal.billingReview.preparePage, { dayId });
    else await queueSummary(ctx, dayId);
    if (adelaideTime() >= "19:00" && !day.autoFinishedAt) await ctx.scheduler.runAfter(0, internal.billingReview.dispatchPage, { dayId });
  },
});
