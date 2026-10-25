import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { adelaideDate, adelaideWeekday } from "../lib/adelaideDate";
import { api, internal } from "../convex/_generated/api";
import { verifyPasswordAndMaybeUpgrade } from "../convex/passwords";

const modules = import.meta.glob("../convex/**/*.{ts,js}");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const adminId = await ctx.db.insert("tutorAccounts", { name: "Admin", email: "admin@example.com", passwordHash: "fixture", hourlyRate: 0, active: true, roles: ["admin", "tutor"] });
    const tutorId = await ctx.db.insert("tutorAccounts", { name: "Tutor", email: "tutor@example.com", passwordHash: "fixture", hourlyRate: 5000, active: true, roles: ["tutor"] });
    const studentId = await ctx.db.insert("students", { name: "Student", yearLevel: "Year 12", subjects: [], active: true, createdAt: Date.now() });
    const subjectId = await ctx.db.insert("subjects", { name: "English", tags: ["Stage 1"], sortOrder: 0, active: true });
    return { adminId, tutorId, studentId, subjectId };
  });
  const admin = t.withIdentity({ subject: ids.adminId, type: "admin", tutorAccountId: ids.adminId, roles: ["admin", "tutor"] });
  const tutor = t.withIdentity({ subject: ids.tutorId, type: "tutor", tutorAccountId: ids.tutorId, roles: ["tutor"] });
  return { t, admin, tutor, ...ids };
}

describe("admin authorization and account safety", () => {
  beforeEach(() => vi.stubEnv("CONVEX_SERVER_SECRET", "test-server-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("protects every subject write and the admin catalogue while keeping dropdowns public", async () => {
    const { t, tutor, subjectId } = await setup();
    for (const caller of [t, tutor]) {
      await expect(caller.mutation(api.subjects.addSubject, { name: "Biology" })).rejects.toThrow();
      await expect(caller.mutation(api.subjects.renameSubject, { id: subjectId, name: "Biology" })).rejects.toThrow();
      await expect(caller.mutation(api.subjects.addTag, { id: subjectId, tag: "Stage 2" })).rejects.toThrow();
      await expect(caller.mutation(api.subjects.removeTag, { id: subjectId, tag: "Stage 1" })).rejects.toThrow();
      await expect(caller.mutation(api.subjects.deleteSubject, { id: subjectId })).rejects.toThrow();
      await expect(caller.mutation(api.subjects.seedSubjects, {})).rejects.toThrow();
      await expect(caller.mutation(api.subjects.syncSubjects, {})).rejects.toThrow();
      await expect(caller.query(api.subjects.listSubjectsGrouped, {})).rejects.toThrow();
    }
    expect(await t.query(api.subjects.listSubjects, {})).toHaveLength(1);
  });

  it("allows an active admin to manage subjects", async () => {
    const { admin } = await setup();
    const id = await admin.mutation(api.subjects.addSubject, { name: "Biology" });
    await admin.mutation(api.subjects.addTag, { id, tag: "Stage 2" });
    await admin.mutation(api.subjects.renameSubject, { id, name: "Chemistry" });
    expect(await admin.query(api.subjects.listSubjectsGrouped, {})).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Chemistry", tags: ["Stage 2"] })]));
    await admin.mutation(api.subjects.removeTag, { id, tag: "Stage 2" });
    await admin.mutation(api.subjects.deleteSubject, { id });
  });

  it("rejects a non-admin even if they supply an admin's id", async () => {
    const { tutor, adminId, tutorId } = await setup();
    await expect(tutor.query(api.admin.listStudents, { adminId })).rejects.toThrow(/Forbidden/);
    await expect(tutor.mutation(api.admin.updateTutorAccount, { adminId, tutorId, roles: ["admin"] })).rejects.toThrow(/Forbidden/);
  });

  it("revokes existing admin sessions on deactivation, including the action authorization query", async () => {
    const { t, admin, adminId } = await setup();
    await t.run(ctx => ctx.db.patch(adminId, { active: false }));
    await expect(admin.query(api.admin.listTutorAccounts, { adminId })).rejects.toThrow(/Forbidden/);
    await expect(admin.query(internal.auth.validateAdminAccess, {})).rejects.toThrow(/Forbidden/);
    await expect(admin.mutation(api.subjects.addSubject, { name: "Biology" })).rejects.toThrow(/Forbidden/);
  });

  it("uses verified identity to prevent self-deletion and self-lockout", async () => {
    const { t, admin, adminId, tutorId } = await setup();
    expect(await admin.mutation(api.admin.deleteTutorAccount, { adminId: tutorId, tutorId: adminId })).toMatchObject({ success: false });
    for (const updates of [{ active: false }, { roles: ["tutor"] }]) {
      expect(await admin.mutation(api.admin.updateTutorAccount, { adminId: tutorId, tutorId: adminId, ...updates })).toMatchObject({ success: false });
    }
    expect(await t.run(ctx => ctx.db.get(adminId))).toMatchObject({ active: true, roles: ["admin", "tutor"] });
  });

  it("resets passwords with bcrypt compatible with tutor login", async () => {
    const { t, admin, adminId, tutorId } = await setup();
    const password = "correct horse battery staple";
    expect(await admin.mutation(api.admin.updateTutorAccount, { adminId, tutorId, password })).toMatchObject({ success: true });
    const row = await t.run(ctx => ctx.db.get(tutorId));
    expect(row!.passwordHash).toMatch(/^\$2/);
    expect((await verifyPasswordAndMaybeUpgrade(password, row!.passwordHash, "tutorSalted")).valid).toBe(true);
    expect(await t.mutation(api.auth.loginTutor, { email: "tutor@example.com", password, serverSecret: "test-server-secret" })).toMatchObject({ success: true });
  });

  it("prevents bypassing the HTTP login rate limiter via public Convex login", async () => {
    const { t } = await setup();
    for (const fn of [api.auth.loginAdmin, api.auth.loginTutor]) {
      await expect(t.mutation(fn, { email: "admin@example.com", password: "anything", serverSecret: "wrong" })).rejects.toThrow(/Unauthorized/);
    }
  });

  it("normalizes changed emails and rejects normalized duplicates", async () => {
    const { t, admin, adminId, tutorId } = await setup();
    expect(await admin.mutation(api.admin.updateTutorAccount, { adminId, tutorId, email: " ADMIN@EXAMPLE.COM " })).toMatchObject({ success: false });
    expect(await admin.mutation(api.admin.updateTutorAccount, { adminId, tutorId, email: " NEW@EXAMPLE.COM " })).toMatchObject({ success: true });
    expect((await t.run(ctx => ctx.db.get(tutorId)))?.email).toBe("new@example.com");
  });

  it.each([-1, 1.5, NaN, Infinity])("rejects invalid hourly rates: %s", async hourlyRate => {
    const { admin, adminId, tutorId } = await setup();
    await expect(admin.mutation(api.admin.updateTutorAccount, { adminId, tutorId, hourlyRate })).rejects.toThrow();
  });

  it("preserves students and billing history when deletion is requested", async () => {
    const { t, admin, adminId, studentId } = await setup();
    const billingProfileId = await admin.mutation(api.billing.createBillingProfile, { adminId, studentId, paymentType: "cash" });
    await t.mutation(internal.billing.recordCharge, { studentId, billingProfileId, amountCents: 5000, status: "cash", weekStartDate: "2026-10-25" });
    expect(await admin.mutation(api.admin.deleteStudent, { adminId, studentId })).toMatchObject({ success: false });
    await expect(admin.mutation(api.billing.deleteBillingProfile, { adminId, billingProfileId })).rejects.toThrow(/Pause billing/);
    expect(await t.run(ctx => ctx.db.get(studentId))).not.toBeNull();
  });

  it("records the verified admin on credit entries and rejects fractional cents", async () => {
    const { t, admin, adminId, tutorId, studentId } = await setup();
    await expect(admin.mutation(api.billing.addCredit, { adminId, studentId, amountCents: 1.5, description: "Credit" })).rejects.toThrow();
    const id = await admin.mutation(api.billing.addCredit, { adminId: tutorId, studentId, amountCents: 100, description: "Credit" });
    expect(await t.run(ctx => ctx.db.get(id))).toMatchObject({ createdBy: adminId, amountCents: 100 });
  });

  it("validates class times on creation and partial edits", async () => {
    const { admin, adminId } = await setup();
    const args = { adminId, name: "English", subject: "English", yearLevel: "Year 12", dayOfWeek: "Monday", startTime: "16:00", endTime: "17:00" };
    await expect(admin.mutation(api.classes.createClass, { ...args, endTime: "15:00" })).rejects.toThrow(/End time/);
    await expect(admin.mutation(api.classes.createClass, { ...args, startTime: "25:00" })).rejects.toThrow();
    const classId = await admin.mutation(api.classes.createClass, args);
    await expect(admin.mutation(api.classes.updateClass, { adminId, classId, startTime: "18:00" })).rejects.toThrow(/End time/);
  });

  it("rejects inactive enrollment targets and invalid billing anchors", async () => {
    const { t, admin, adminId, studentId } = await setup();
    const classId = await admin.mutation(api.classes.createClass, { adminId, name: "English", subject: "English", yearLevel: "Year 12", dayOfWeek: "Monday", startTime: "16:00", endTime: "17:00" });
    await admin.mutation(api.classes.assignStudentToClass, { adminId, studentId, classId });
    await expect(admin.mutation(api.classes.setEnrollmentCadence, { adminId, studentId, classId, intervalWeeks: 2, anchorDate: "2026-02-30" })).rejects.toThrow(/valid date/);
    await t.run(ctx => ctx.db.patch(studentId, { active: false }));
    await expect(admin.mutation(api.classes.assignStudentToClass, { adminId, studentId, classId })).rejects.toThrow(/active/);
  });
});


describe("Adelaide billing dates", () => {
  it("uses daylight saving at the local date boundary", () => {
    const now = new Date("2026-10-25T13:45:00Z");
    expect(adelaideDate(now)).toBe("2026-10-26");
    expect(adelaideWeekday(now)).toBe("Monday");
  });
  it("uses standard time in winter", () => {
    const now = new Date("2026-07-25T13:45:00Z");
    expect(adelaideDate(now)).toBe("2026-07-25");
    expect(adelaideWeekday(now)).toBe("Saturday");
  });
});
