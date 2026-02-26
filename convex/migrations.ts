import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time migration: remove legacy assignedTutorId/assignedTutorIds from all students.
 * Run from Convex dashboard (Functions → migrations → stripLegacyTutorFields → Run).
 * After it completes, remove assignedTutorId and assignedTutorIds from the students table in schema.ts and push again.
 */
export const stripLegacyTutorFields = internalMutation({
  args: {},
  returns: v.object({ updated: v.number() }),
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    let updated = 0;
    for (const student of students) {
      const doc = student as Record<string, unknown>;
      if (doc.assignedTutorId !== undefined || doc.assignedTutorIds !== undefined) {
        await ctx.db.patch(student._id, {
          assignedTutorId: undefined,
          assignedTutorIds: undefined,
        } as Record<string, undefined>);
        updated++;
      }
    }
    return { updated };
  },
});
