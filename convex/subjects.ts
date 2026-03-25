import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// Default subject catalogue — one entry per base subject, with optional tags
const defaultSubjects: { name: string; tags: string[] }[] = [
  { name: "UCAT", tags: [] },
  { name: "Interview Prep", tags: [] },
  { name: "Specialist Maths", tags: ["Stage 1", "Stage 2"] },
  { name: "Maths Methods", tags: ["Stage 1", "Stage 2"] },
  { name: "Mathematical Methods", tags: ["Stage 1", "Stage 2"] },
  { name: "Essential Mathematics", tags: ["Stage 1", "Stage 2"] },
  { name: "General Mathematics", tags: ["Stage 1", "Stage 2"] },
  { name: "Physics", tags: ["Stage 1", "Stage 2"] },
  { name: "Chemistry", tags: ["Stage 1", "Stage 2"] },
  { name: "Biology", tags: ["Stage 1", "Stage 2"] },
  { name: "Psychology", tags: ["Stage 1", "Stage 2"] },
  { name: "English", tags: ["Stage 1", "Stage 2"] },
  { name: "English Literature", tags: ["Stage 1", "Stage 2"] },
  { name: "Accounting", tags: ["Stage 1", "Stage 2"] },
  { name: "Research Project", tags: ["Stage 1", "Stage 2"] },
];

// Helper: compute the dropdown label for a subject + optional tag
function toLabel(name: string, tag?: string) {
  return tag ? `${name} (${tag})` : name;
}

// ── Queries ─────────────────────────────────────────────────────────────────

/** Returns the flat list used by class/student dropdowns.
 *  Each tag on a subject generates its own entry, e.g. "English (Stage 1)". */
export const listSubjects = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("subjects"),
      name: v.string(),
      tag: v.optional(v.string()),
      label: v.string(),
      active: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const sorted = subjects.sort((a, b) => a.name.localeCompare(b.name));

    const rows: {
      _id: (typeof sorted)[number]["_id"];
      name: string;
      tag: string | undefined;
      label: string;
      active: boolean;
    }[] = [];

    for (const s of sorted) {
      const tags = s.tags ?? [];
      if (tags.length === 0) {
        rows.push({ _id: s._id, name: s.name, tag: undefined, label: s.name, active: s.active });
      } else {
        for (const tag of tags) {
          rows.push({ _id: s._id, name: s.name, tag, label: toLabel(s.name, tag), active: s.active });
        }
      }
    }

    return rows.sort((a, b) => a.label.localeCompare(b.label));
  },
});

/** Returns one entry per base subject — used by the admin Subjects tab. */
export const listSubjectsGrouped = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("subjects"),
      name: v.string(),
      tags: v.array(v.string()),
      sortOrder: v.number(),
      active: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({
        _id: s._id,
        name: s.name,
        tags: s.tags ?? [],
        sortOrder: s.sortOrder,
        active: s.active,
      }));
  },
});

// ── Mutations ────────────────────────────────────────────────────────────────

export const addSubject = mutation({
  args: { name: v.string() },
  returns: v.id("subjects"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new ConvexError("Subject name is required.");
    const existing = await ctx.db.query("subjects").collect();
    if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      throw new ConvexError("A subject with that name already exists.");
    }
    const maxOrder = existing.reduce((max, s) => Math.max(max, s.sortOrder), -1);
    return await ctx.db.insert("subjects", { name, tags: [], active: true, sortOrder: maxOrder + 1 });
  },
});

export const renameSubject = mutation({
  args: { id: v.id("subjects"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new ConvexError("Subject name is required.");
    const existing = await ctx.db.query("subjects").collect();
    if (existing.some((s) => s._id !== args.id && s.name.toLowerCase() === name.toLowerCase())) {
      throw new ConvexError("A subject with that name already exists.");
    }
    await ctx.db.patch(args.id, { name });
    return null;
  },
});

export const addTag = mutation({
  args: { id: v.id("subjects"), tag: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tag = args.tag.trim();
    if (!tag) throw new ConvexError("Tag cannot be empty.");
    const subject = await ctx.db.get(args.id);
    if (!subject) throw new ConvexError("Subject not found.");
    const current = subject.tags ?? [];
    if (current.includes(tag)) throw new ConvexError("Tag already exists.");
    await ctx.db.patch(args.id, { tags: [...current, tag] });
    return null;
  },
});

export const removeTag = mutation({
  args: { id: v.id("subjects"), tag: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.id);
    if (!subject) throw new ConvexError("Subject not found.");
    await ctx.db.patch(args.id, { tags: (subject.tags ?? []).filter((t) => t !== args.tag) });
    return null;
  },
});

export const deleteSubject = mutation({
  args: { id: v.id("subjects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// ── Seed / Sync ──────────────────────────────────────────────────────────────

export const seedSubjects = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("subjects").collect();
    if (existing.length > 0) return null;
    let order = 0;
    for (const s of defaultSubjects) {
      await ctx.db.insert("subjects", { name: s.name, tags: s.tags, active: true, sortOrder: order++ });
    }
    return null;
  },
});

/** Migrates old per-stage docs to the new single-doc-per-subject model,
 *  then inserts any missing subjects from the default catalogue. */
export const syncSubjects = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("subjects").collect();

    // Detect old-format docs (they have no `tags` array — field will be undefined at runtime)
    const oldFormat = existing.filter((s) => !(s as { tags?: unknown[] }).tags);

    if (oldFormat.length > 0) {
      // Group old docs by base name, collecting their stages
      const byName = new Map<string, { stages: string[]; ids: string[]; sortOrder: number }>();
      for (const s of oldFormat) {
        const old = s as unknown as { name: string; stage?: string; _id: string; sortOrder: number };
        const key = old.name;
        if (!byName.has(key)) byName.set(key, { stages: [], ids: [], sortOrder: old.sortOrder });
        const entry = byName.get(key)!;
        if (old.stage) entry.stages.push(old.stage);
        entry.ids.push(old._id);
      }

      // Delete old docs and create new merged ones
      for (const [name, { stages, ids, sortOrder }] of byName) {
        for (const id of ids) await ctx.db.delete(id as Parameters<typeof ctx.db.delete>[0]);
        await ctx.db.insert("subjects", { name, tags: stages, active: true, sortOrder });
      }
    }

    // Add any subjects missing from the default catalogue
    const current = await ctx.db.query("subjects").collect();
    const existingNames = new Set(current.map((s) => s.name.toLowerCase()));
    const maxOrder = current.reduce((max, s) => Math.max(max, s.sortOrder), -1);
    let order = maxOrder + 1;
    for (const s of defaultSubjects) {
      if (!existingNames.has(s.name.toLowerCase())) {
        await ctx.db.insert("subjects", { name: s.name, tags: s.tags, active: true, sortOrder: order++ });
      }
    }

    return null;
  },
});
