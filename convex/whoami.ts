// TEMPORARY verification endpoint for the ctx.auth pipeline. Returns the
// verified identity (or null). Remove once the auth migration is confirmed.
import { query } from "./_generated/server";
import { v } from "convex/values";

export const whoami = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity ?? null;
  },
});
