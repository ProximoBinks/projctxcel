/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { parseRecipients } from "../lib/emailRecipients";
import { DEFAULT_GREETING, missingFields, personalize } from "../lib/emailPersonalization";
import { prepareEmailHtml } from "../lib/emailHtml";

describe("recipient imports and personalisation", () => {
  it("accepts lists, email/name pairs, reversed pairs and display addresses", () => {
    const p = parseRecipients('a@example.com, Anne-Marie\nJane Doe,jane@example.com\nMika <mika@example.com>\nx@example.com,y@example.com\nz@example.com;other@example.com');
    expect(p.errors).toEqual([]); expect(p.recipients).toHaveLength(7);
    expect(p.recipients[0].name).toBe("Anne-Marie");
    expect(p.recipients[1].name).toBe("Jane Doe");
  });
  it("reads quoted CSV, Unicode names, custom columns, BOM and deduplicates", () => {
    const p = parseRecipients('\uFEFFemail,name,course\nA@EXAMPLE.COM,"O’Connor, Zoë",Medicine\na@example.com,Duplicate,Medicine\nb@example.com,李 明,Dentistry');
    expect(p.errors).toEqual([]); expect(p.duplicates).toBe(1);
    expect(p.recipients[0]).toMatchObject({ email: "a@example.com", name: "O’Connor, Zoë", fields: { COURSE: "Medicine" } });
    expect(p.recipients[1].name).toBe("李 明");
  });
  it("reads spreadsheet tabs and first/last names", () => {
    const p = parseRecipients('First Name\tLast Name\tEmail Address\nMary\tMcDonald\tmary@example.com');
    expect(p.errors).toEqual([]); expect(p.recipients[0].name).toBe("Mary McDonald");
  });
  it("reports invalid rows rather than silently dropping them", () => {
    expect(parseRecipients('good@example.com\nbad-address').errors).toHaveLength(1);
    expect(parseRecipients('email,name\na@example.com,A,extra').errors).toHaveLength(1);
    expect(parseRecipients('email,name\na@example.com,"broken').errors.length).toBeGreaterThan(0);
  });
  it("accepts 5,000 unique recipients and rejects overflow", () => {
    const input = Array.from({ length: 5000 }, (_, i) => `person${i}@example.com`).join('\n');
    expect(parseRecipients(input).errors).toEqual([]);
    expect(parseRecipients(input + '\nextra@example.com').errors).toHaveLength(1);
  });
  it("personalises every occurrence without changing case or injecting HTML", () => {
    const recipient = { email: "a@example.com", name: 'Anne-Marie <b>McDonald</b>', fields: { COURSE: "Medicine & Dentistry" } };
    const options = { greeting: "Dear", nameStyle: "full" as const, fallbackName: "student" };
    expect(personalize('{{GREETING}} / {{name}} / {{COURSE}}', recipient, options, true)).toBe('Dear Anne-Marie &lt;b&gt;McDonald&lt;/b&gt; / Anne-Marie &lt;b&gt;McDonald&lt;/b&gt; / Medicine &amp; Dentistry');
    expect(personalize('{{NAME}}', { ...recipient, name: "" }, options)).toBe("student");
  });
  it("flags unknown fields but leaves Postmark unsubscribe syntax intact", () => {
    const recipient = { email: "a@example.com", name: "Alex", fields: {} };
    expect(missingFields('{{NAME}} {{COURSE}} {{{ pm:unsubscribe }}}', [recipient], DEFAULT_GREETING)).toEqual(["COURSE"]);
    expect(personalize('{{{ pm:unsubscribe }}}', recipient, DEFAULT_GREETING, true)).toBe('{{{ pm:unsubscribe }}}');
  });
});

describe("email rendering", () => {
  it("inlines stylesheet rules, strips active content and produces plain text", () => {
    const p = prepareEmailHtml('<style>.greeting { color:#123456; font-size:18px; }</style><p class="greeting" onclick="evil()">Hello {{NAME}}</p><script>evil()</script><form><input></form><a href="javascript:alert(1)">bad</a>');
    expect(p.html).toContain('color: #123456'); expect(p.html).toContain('font-size: 18px');
    expect(p.html).not.toMatch(/<script|onclick|<form|<input|javascript:/);
    expect(p.text).toContain('Hello {{NAME}}');
  });
  it("rejects external CSS, local images and personalisation in URLs", () => {
    expect(() => prepareEmailHtml('<link rel="stylesheet" href="https://example.com/a.css"><p>x</p>')).toThrow(/External/);
    expect(() => prepareEmailHtml('<img src="file:///tmp/photo.png"><p>x</p>')).toThrow(/public https/);
    expect(() => prepareEmailHtml('<a href="{{COURSE}}">x</a>')).toThrow(/not in link/);
  });
  it("prepares the workshop with tables, responsive styles, all content and unsubscribe", () => {
    const p = prepareEmailHtml(readFileSync('emails/interview-workshop-email.html', 'utf8'));
    expect(p.html).toContain('role="presentation"'); expect(p.html).toContain('@media');
    expect(p.html).toContain('{{GREETING}}'); expect(p.html).toContain('{{{ pm:unsubscribe }}}');
    expect(p.text).toContain('10:30 am'); expect(p.text).toContain('https://meet.google.com/vre-ydoa-bjs');
    expect(p.bytes).toBeLessThan(10000);
  });
  it("rejects HTML that risks Gmail clipping", () => {
    expect(() => prepareEmailHtml('<p>' + 'a'.repeat(91000) + '</p>')).toThrow(/under 90 KB/);
  });
});

const modules = import.meta.glob('../convex/**/*.{ts,js}');

describe("durable campaign queue (Postmark mocked; no emails sent)", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.stubEnv("CONVEX_SERVER_SECRET", "test-secret"); vi.stubEnv("POSTMARK_SERVER_TOKEN", "POSTMARK_API_TEST"); });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  async function setup(count = 2) {
    const t = convexTest(schema, modules);
    const adminId = await t.run(ctx => ctx.db.insert("tutorAccounts", { email: "admin@example.com", name: "Admin", passwordHash: "test-only", active: true, roles: ["admin"], hourlyRate: 0 }));
    const args = { adminId, serverSecret: "test-secret", requestId: "unique-test-request-123", subject: "Hi {{NAME}}", html: '<p style="color:blue">{{GREETING}}</p>', text: "{{GREETING}}", from: "admin@simpletuition.com.au", senderName: "Simple Tuition", replyTo: "admin@simpletuition.com.au", greeting: DEFAULT_GREETING, isTest: false, recipients: Array.from({ length: count }, (_, i) => ({ email: `p${i}@example.com`, name: i === 0 ? "Mary McDonald" : "", fields: {} })) };
    const admin = t.withIdentity({ subject: adminId, type: "admin", tutorAccountId: adminId, roles: ["admin"] });
    return { t, admin, args };
  }
  it("rejects public creation and unauthenticated history", async () => {
    const { t, args } = await setup();
    await expect(t.mutation(api.emailCampaigns.create, { ...args, serverSecret: "wrong" })).rejects.toThrow(/Unauthorized/);
    await expect(t.query(api.emailCampaigns.list, {})).rejects.toThrow(/Unauthenticated/);
  });
  it("creates one campaign for repeated requests", async () => {
    const { t, args } = await setup();
    const a = await t.mutation(api.emailCampaigns.create, args);
    const b = await t.mutation(api.emailCampaigns.create, args);
    expect(a).toBe(b);
    expect(await t.run(ctx => ctx.db.query("emailDeliveries").collect())).toHaveLength(2);
  });
  it("sends individual HTML + text messages and records partial rejection", async () => {
    const { t, admin, args } = await setup();
    const mockedFetch = vi.fn(async (_url: unknown, init: RequestInit) => {
      const messages = JSON.parse(String(init.body));
      expect(messages).toHaveLength(2); expect(messages[0].To).toBe("p0@example.com");
      expect(messages[0].HtmlBody).toContain("Hi Mary"); expect(messages[1].TextBody).toBe("Hi there");
      expect(messages[0].MessageStream).toBe("default-broadcast-stream");
      return new Response(JSON.stringify([{ ErrorCode: 0, MessageID: "accepted-id" }, { ErrorCode: 406, Message: "Inactive recipient" }]));
    }); vi.stubGlobal("fetch", mockedFetch);
    const campaignId = await t.mutation(api.emailCampaigns.create, args);
    await t.action(internal.emailDelivery.sendBatch, { campaignId });
    await t.action(internal.emailDelivery.sendBatch, { campaignId });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect((await admin.query(api.emailCampaigns.list, {}))[0]).toMatchObject({ status: "complete", accepted: 1, failed: 1 });
  });
  it("never automatically retries ambiguous network failures", async () => {
    const { t, admin, args } = await setup();
    const mockedFetch = vi.fn(async () => { throw new Error("connection reset"); }); vi.stubGlobal("fetch", mockedFetch);
    const campaignId = await t.mutation(api.emailCampaigns.create, args);
    await t.action(internal.emailDelivery.sendBatch, { campaignId });
    await t.action(internal.emailDelivery.sendBatch, { campaignId });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect((await admin.query(api.emailCampaigns.list, {}))[0]).toMatchObject({ status: "complete", uncertain: 2, accepted: 0 });
  });
  it("stops unclaimed recipients when cancelled", async () => {
    const { t, admin, args } = await setup();
    const mockedFetch = vi.fn(); vi.stubGlobal("fetch", mockedFetch);
    const campaignId = await t.mutation(api.emailCampaigns.create, args);
    await admin.mutation(api.emailCampaigns.cancel, { campaignId });
    await t.action(internal.emailDelivery.sendBatch, { campaignId });
    expect(mockedFetch).not.toHaveBeenCalled();
  });
  it("recovers a crashed batch without resending its recipients", async () => {
    const { t, admin, args } = await setup(51);
    const campaignId = await t.mutation(api.emailCampaigns.create, args);
    const batch = await t.mutation(internal.emailCampaigns.claim, { campaignId });
    expect(batch?.recipients).toHaveLength(50);
    expect(await t.mutation(internal.emailCampaigns.claim, { campaignId })).toBeNull();
    await t.mutation(internal.emailCampaigns.recover, { campaignId, ids: batch!.recipients.map(r => r._id) });
    const next = await t.mutation(internal.emailCampaigns.claim, { campaignId });
    expect(next?.recipients).toHaveLength(1);
    expect((await admin.query(api.emailCampaigns.list, {}))[0].uncertain).toBe(50);
  });
});
