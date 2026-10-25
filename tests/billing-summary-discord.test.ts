import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { internal } from "../convex/_generated/api";
import { adelaideTimestamp } from "../lib/adelaideDate";
import { summaryPayload } from "../convex/billingSummaryDiscord";

const modules = import.meta.glob("../convex/**/*.{ts,js}");
const date = "2026-10-26";
const fetchMock = vi.fn();
const at = (time: string) => vi.setSystemTime(adelaideTimestamp(date, time));

async function setup(count = 0) {
  const t = convexTest(schema, modules);
  const dayId = await t.run(async ctx => {
    const dayId = await ctx.db.insert("billingReviewDays", {
      date, status: "ready", cursor: null, lessonCount: count, pendingCount: count,
      approvedCount: 0, heldCount: 0, submittedCount: 0, totalCents: count * 3000,
      approvedCents: 0, createdAt: Date.now(), updatedAt: Date.now(),
    });
    if (count) {
      const studentId = await ctx.db.insert("students", { name: "Student", yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
      const profileId = await ctx.db.insert("billingProfiles", { studentId, paymentType: "cash", status: "active", createdAt: Date.now() });
      const classId = await ctx.db.insert("classes", { name: "English", subject: "English", yearLevel: "Year 12", dayOfWeek: "Monday", startTime: "16:00", endTime: "17:00", active: true, createdAt: Date.now() });
      for (let i = 0; i < count; i++) await ctx.db.insert("billingReviews", {
        dayId, date, billingProfileId: profileId, studentId, classId,
        studentName: "@everyone [unsafe](https://example.com)\n".repeat(50), className: "*English*".repeat(50),
        subject: "English", tutorName: "Tutor", startTime: "16:00", endTime: "17:00",
        scheduledCents: 3000, amountCents: 3000, fingerprint: "fixture", version: 1,
        status: "pending", autoChargeEligible: false, createdAt: Date.now(), updatedAt: Date.now(),
      });
    }
    return dayId;
  });
  const delivery = () => t.run(async ctx => (await ctx.db.get(dayId))?.discord);
  return { t, dayId, delivery };
}

describe("daily Discord summary", () => {
  beforeEach(() => {
    vi.useFakeTimers(); at("18:00");
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/test/secret?thread_id=123");
    vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ id: "message_1" }), { status: 200 }));
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("queues an early-prepared review only at 6pm and sends once across repeated ticks and actions", async () => {
    const { t, dayId, delivery } = await setup();
    at("17:59"); await t.mutation(internal.billingReview.tick, {});
    expect(await delivery()).toBeNull();
    at("18:00");
    await Promise.all([t.mutation(internal.billingReview.tick, {}), t.mutation(internal.billingReview.tick, {})]);
    expect(await delivery()).toMatchObject({ status: "queued", attempts: 0 });
    await Promise.all([t.action(internal.billingSummaryDiscord.send, { dayId }), t.action(internal.billingSummaryDiscord.send, { dayId })]);
    await t.mutation(internal.billingReview.tick, {});
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await delivery()).toMatchObject({ status: "sent", messageId: "message_1", attempts: 1 });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.searchParams.get("wait")).toBe("true");
    expect(url.searchParams.get("thread_id")).toBe("123");
    expect(JSON.parse(options.body).embeds[0].description).toContain("No billable scheduled lessons today");
    expect(await t.run(ctx => ctx.db.query("billingOperations").collect())).toHaveLength(0);
  });

  it("waits for all preparation pages and does not repost after refresh", async () => {
    const { t, dayId, delivery } = await setup();
    await t.run(ctx => ctx.db.patch(dayId, { status: "preparing" }));
    await t.mutation(internal.billingReview.tick, {});
    expect(await delivery()).toBeNull();
    await t.mutation(internal.billingReview.preparePage, { dayId });
    expect(await delivery()).toMatchObject({ status: "queued" });
    // Refresh starts between queueing and execution: defer until ready.
    await t.run(ctx => ctx.db.patch(dayId, { status: "preparing" }));
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    expect(fetchMock).not.toHaveBeenCalled();
    await t.mutation(internal.billingReview.preparePage, { dayId });
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    await t.run(ctx => ctx.db.patch(dayId, { status: "preparing" }));
    await t.mutation(internal.billingReview.preparePage, { dayId });
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bounds large summaries, escapes names, disables mentions and links to the full review", async () => {
    const { t, dayId } = await setup(40);
    await t.mutation(internal.billingReview.tick, {});
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.allowed_mentions).toEqual({ parse: [] });
    const text = payload.embeds[0].description;
    expect(text.length).toBeLessThan(4096);
    expect(text).toContain("40 student lessons · A$1200.00");
    expect(text).toContain("25 more");
    expect(text).not.toContain("@everyone");
    expect(text).not.toContain("[unsafe]");
    expect(text).toContain("https://simpletuition.com.au/admin");
    expect(text).toContain("7pm Adelaide time");
    const data = await t.run(async ctx => ({ day: (await ctx.db.get(dayId))!, rows: await ctx.db.query("billingReviews").collect() }));
    expect(summaryPayload(data.day, data.rows).embeds[0].description.length).toBeLessThan(4096);
  });

  it("respects rate-limit delays and caps retries at three attempts", async () => {
    const { t, dayId, delivery } = await setup();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ retry_after: 10 }), { status: 429 }));
    await t.mutation(internal.billingReview.tick, {});
    for (let i = 1; i <= 3; i++) {
      await t.action(internal.billingSummaryDiscord.send, { dayId });
      expect(fetchMock).toHaveBeenCalledTimes(i);
      if (i < 3) {
        expect(await delivery()).toMatchObject({ status: "queued", attempts: i });
        await t.action(internal.billingSummaryDiscord.send, { dayId });
        expect(fetchMock).toHaveBeenCalledTimes(i);
        vi.setSystemTime(Date.now() + 10_000);
      }
    }
    expect(await delivery()).toMatchObject({ status: "failed", attempts: 3 });
    await t.mutation(internal.billingReview.tick, {});
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each(["network", "server", "invalid", "missing-id"])("records %s failures without blindly sending again", async failure => {
    const { t, dayId, delivery } = await setup();
    if (failure === "network") fetchMock.mockRejectedValue(new Error("secret webhook URL must not be logged"));
    if (failure === "server") fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    if (failure === "invalid") fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    if (failure === "missing-id") fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await t.mutation(internal.billingReview.tick, {});
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    expect(await delivery()).toMatchObject({ status: failure === "invalid" ? "failed" : "uncertain" });
    expect((await delivery())?.error).not.toContain("secret");
    await t.mutation(internal.billingReview.tick, {});
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports missing configuration without sending", async () => {
    const { t, dayId, delivery } = await setup();
    vi.stubEnv("DISCORD_WEBHOOK_URL", "");
    await t.mutation(internal.billingReview.tick, {});
    await t.action(internal.billingSummaryDiscord.send, { dayId });
    expect(await delivery()).toMatchObject({ status: "failed", error: "DISCORD_WEBHOOK_URL is not configured." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("marks interrupted sends uncertain without allowing duplicate claims", async () => {
    const { t, dayId, delivery } = await setup();
    await t.mutation(internal.billingReview.tick, {});
    await t.mutation(internal.billingReviewNotifications.claim, { dayId });
    await t.mutation(internal.billingReviewNotifications.expire, { dayId, attempt: 1 });
    expect(await delivery()).toMatchObject({ status: "sending" });
    vi.setSystemTime(Date.now() + 120_000);
    await t.mutation(internal.billingReviewNotifications.expire, { dayId, attempt: 1 });
    expect(await delivery()).toMatchObject({ status: "uncertain" });
    expect(await t.mutation(internal.billingReviewNotifications.claim, { dayId })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
