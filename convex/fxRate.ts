import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin, validatePositive } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query("fxRateCache").order("desc").first();
  },
});

export const set = mutation({
  args: {
    usdToEgp: v.number(),
    source: v.string(),
    manualOverride: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    validatePositive(args.usdToEgp, "usdToEgp");

    return await ctx.db.insert("fxRateCache", {
      ...args,
      fetchedAtMs: Date.now(),
    });
  },
});
