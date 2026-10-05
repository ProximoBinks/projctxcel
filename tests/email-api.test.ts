import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConvexError } from "convex/values";

const mocks = vi.hoisted(() => ({ mutation: vi.fn(), verify: vi.fn(), cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("../lib/auth", () => ({ verifyAuthToken: mocks.verify }));
vi.mock("../lib/convexServer", () => ({ convex: { mutation: mocks.mutation } }));
vi.mock("../lib/serverSecret", () => ({ getServerSecret: () => "test-server-secret" }));
vi.mock("../lib/email", () => ({ getFromEmail: () => "admin@simpletuition.com.au" }));

import { POST } from "../app/api/admin/email/route";

const payload = {
  action: "send", requestId: "email-api-regression-123", subject: "Workshop for {{NAME}}",
  html: '<style>p { color: #123456; }</style><p>{{GREETING}},</p>',
  recipientInput: "elliot@example.com,Elliot", senderName: "Simple Tuition", replyTo: "admin@simpletuition.com.au",
};
const request = (body = payload) => new Request("https://simpletuition.com.au/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://simpletuition.com.au" }, body: JSON.stringify(body) });

describe("admin email HTTP send path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "test-session" }) });
    mocks.verify.mockResolvedValue({ id: "test-admin", type: "admin", roles: ["admin"] });
    mocks.mutation.mockResolvedValue("test-campaign-id");
  });
  it("queues prepared HTML and a text alternative through the authenticated API", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ campaignId: "test-campaign-id" });
    expect(mocks.mutation).toHaveBeenCalledTimes(1);
    expect(mocks.mutation.mock.calls[0][1]).toMatchObject({ requestId: payload.requestId, adminId: "test-admin", from: "admin@simpletuition.com.au", recipients: [{ email: "elliot@example.com", name: "Elliot", fields: {} }] });
    expect(mocks.mutation.mock.calls[0][1].html).toContain("color: #123456");
    expect(mocks.mutation.mock.calls[0][1].text).toContain("{{GREETING}}");
  });
  it("returns a clear 503 for missing Postmark configuration", async () => {
    mocks.mutation.mockRejectedValue(new ConvexError({ code: "POSTMARK_NOT_CONFIGURED" }));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "POSTMARK_NOT_CONFIGURED", message: "Postmark is not configured for email sending. No emails were queued." });
  });
  it("reports unexpected queue failure as a service error without exposing arguments", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.mutation.mockRejectedValue(new Error("[Request ID: test-request] private arguments must not escape"));
      const response = await POST(request());
      expect(response.status).toBe(502);
      expect(JSON.stringify(await response.json())).not.toContain("private arguments");
      expect(log).toHaveBeenCalledWith("Admin email queue failed", { requestId: "test-request" });
    } finally { log.mockRestore(); }
  });
  it("keeps invalid recipient errors as 400 and never calls the queue", async () => {
    const response = await POST(request({ ...payload, recipientInput: "invalid" }));
    expect(response.status).toBe(400); expect(mocks.mutation).not.toHaveBeenCalled();
  });
  it("requires an admin session for sending", async () => {
    mocks.verify.mockResolvedValue({ type: "student", roles: [] });
    const response = await POST(request());
    expect(response.status).toBe(401); expect(mocks.mutation).not.toHaveBeenCalled();
  });
});
