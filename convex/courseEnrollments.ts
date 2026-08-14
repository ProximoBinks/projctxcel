import { mutation, internalMutation, internalQuery, internalAction, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireAdmin } from "./identity";

// Price of the Interview Intensive in cents (AUD). The authoritative amount is
// the Stripe Price referenced by STRIPE_INTERVIEW_COURSE_PRICE_ID; this is the
// provisional figure recorded before Checkout, and the webhook overwrites it
// with what Stripe actually collected.
export const INTERVIEW_COURSE_AMOUNT_CENTS = 39900;

const PROGRAMS = ["medicine", "dentistry", "both"] as const;

/**
 * Public: a prospective student filling in the landing-page form. Deliberately
 * unauthenticated — these are new customers, not existing students or admins —
 * so it only ever writes a `pending_payment` row and never grants anything.
 */
export const createPending = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    program: v.string(),
    interviewDate: v.optional(v.string()),
    consent: v.boolean(),
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
  },
  returns: v.id("courseEnrollments"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const phone = args.phone.trim();

    if (!name || !email || !phone) {
      throw new Error("Name, email and phone are required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!PROGRAMS.includes(args.program as (typeof PROGRAMS)[number])) {
      throw new Error("Please choose a program.");
    }
    if (!args.consent) {
      throw new Error("Please agree to the terms before continuing.");
    }

    const enrollmentId = await ctx.db.insert("courseEnrollments", {
      name,
      email,
      phone,
      program: args.program,
      interviewDate: args.interviewDate?.trim() || undefined,
      consent: args.consent,
      sourcePage: args.sourcePage,
      utm: args.utm,
      status: "pending_payment",
      amountCents: INTERVIEW_COURSE_AMOUNT_CENTS,
      createdAt: Date.now(),
    });

    // Fire-and-forget: the admin should hear about a new signup immediately,
    // not only once (if) they get through Stripe Checkout.
    await ctx.scheduler.runAfter(0, internal.courseEnrollments.notifyAdmin, {
      name,
      email,
      phone,
      program: args.program,
    });

    await ctx.scheduler.runAfter(0, internal.googleSheets.appendEnrollment, {
      enrollmentId,
      name,
      email,
      phone,
      program: args.program,
      status: "pending_payment",
      amountCents: INTERVIEW_COURSE_AMOUNT_CENTS,
      createdAt: Date.now(),
    });

    return enrollmentId;
  },
});

/**
 * Emails the admin the moment someone fills out the Interview Intensive form,
 * mirroring the main enquiry form's immediate notification — well before (and
 * regardless of whether) Checkout is ever completed.
 *
 * Lives in Next.js (not here) because that's where the Postmark transport and
 * `CONTACT_TO_EMAIL` already are; this action just calls it over HTTP, guarded
 * by the same CONVEX_SERVER_SECRET used for the paid-confirmation email.
 */
export const notifyAdmin = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    program: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const siteUrl = process.env.SITE_URL ?? "https://simpletuition.com.au";
    const secret = process.env.CONVEX_SERVER_SECRET;
    if (!secret) {
      console.error("CONVEX_SERVER_SECRET not set — skipping admin notification");
      return null;
    }

    try {
      const response = await fetch(`${siteUrl}/api/interview-enrollment-notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-server-secret": secret,
        },
        body: JSON.stringify(args),
      });
      if (!response.ok) {
        console.error(
          `Admin notification route returned ${response.status}`,
          await response.text(),
        );
      }
    } catch (error) {
      console.error("Failed to notify admin of interview enrollment", error);
    }

    return null;
  },
});

export const getInternal = internalQuery({
  args: { enrollmentId: v.id("courseEnrollments") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courseEnrollments"),
      name: v.string(),
      email: v.string(),
      program: v.string(),
      status: v.string(),
      amountCents: v.number(),
      interviewDate: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { enrollmentId }) => {
    const row = await ctx.db.get(enrollmentId);
    if (!row) return null;
    return {
      _id: row._id,
      name: row.name,
      email: row.email,
      program: row.program,
      status: row.status,
      amountCents: row.amountCents,
      interviewDate: row.interviewDate,
    };
  },
});

export const setCheckoutSession = internalMutation({
  args: {
    enrollmentId: v.id("courseEnrollments"),
    stripeCheckoutSessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { enrollmentId, stripeCheckoutSessionId }) => {
    await ctx.db.patch(enrollmentId, { stripeCheckoutSessionId });
    return null;
  },
});

/**
 * Called from the Stripe webhook once payment is confirmed. Idempotent: Stripe
 * retries webhooks and may deliver the same event more than once, so a row
 * already marked paid is left alone and reported as such.
 */
export const markPaid = internalMutation({
  args: {
    enrollmentId: v.id("courseEnrollments"),
    stripePaymentIntentId: v.optional(v.string()),
    amountCents: v.optional(v.number()),
  },
  returns: v.object({
    updated: v.boolean(),
    name: v.string(),
    email: v.string(),
    program: v.string(),
    amountCents: v.number(),
    interviewDate: v.optional(v.string()),
  }),
  handler: async (ctx, { enrollmentId, stripePaymentIntentId, amountCents }) => {
    const row = await ctx.db.get(enrollmentId);
    if (!row) throw new Error(`Enrollment ${enrollmentId} not found`);

    const finalAmount = amountCents ?? row.amountCents;

    if (row.status === "paid") {
      return {
        updated: false,
        name: row.name,
        email: row.email,
        program: row.program,
        amountCents: row.amountCents,
        interviewDate: row.interviewDate,
      };
    }

    await ctx.db.patch(enrollmentId, {
      status: "paid",
      stripePaymentIntentId: stripePaymentIntentId ?? row.stripePaymentIntentId,
      amountCents: finalAmount,
    });

    return {
      updated: true,
      name: row.name,
      email: row.email,
      program: row.program,
      amountCents: finalAmount,
      interviewDate: row.interviewDate,
    };
  },
});

export const markFailed = internalMutation({
  args: { enrollmentId: v.id("courseEnrollments") },
  returns: v.object({ amountCents: v.number() }),
  handler: async (ctx, { enrollmentId }) => {
    const row = await ctx.db.get(enrollmentId);
    // Never downgrade a paid enrollment — an expiry event can arrive late.
    if (row && row.status !== "paid") {
      await ctx.db.patch(enrollmentId, { status: "failed" });
    }
    return { amountCents: row?.amountCents ?? 0 };
  },
});

/** Admin-only listing, matching the auth pattern used by enquiries.list. */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("courseEnrollments"),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      program: v.string(),
      interviewDate: v.optional(v.string()),
      status: v.string(),
      amountCents: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
    return rows.map((r) => ({
      _id: r._id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      program: r.program,
      interviewDate: r.interviewDate,
      status: r.status,
      amountCents: r.amountCents,
      createdAt: r.createdAt,
    }));
  },
});
