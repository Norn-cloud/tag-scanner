import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin, validatePositive } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query("goldPriceCache").order("desc").first();
  },
});

export const set = mutation({
  args: {
    pricePerGram18K: v.number(),
    pricePerGram21K: v.number(),
    pricePerGram24K: v.number(),
    source: v.string(),
    manualOverride: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    validatePositive(args.pricePerGram18K, "pricePerGram18K");
    validatePositive(args.pricePerGram21K, "pricePerGram21K");
    validatePositive(args.pricePerGram24K, "pricePerGram24K");

    return await ctx.db.insert("goldPriceCache", {
      ...args,
      fetchedAtMs: Date.now(),
    });
  },
});
