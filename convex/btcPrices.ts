import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin, validatePositive, validateKarat } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query("btcPrices").collect();
  },
});

export const getByCategory = query({
  args: { categoryAr: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("btcPrices")
      .withIndex("by_category_weight", (q) => q.eq("categoryAr", args.categoryAr))
      .collect();
  },
});

export const lookup = query({
  args: { categoryAr: v.string(), weightGrams: v.number() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("btcPrices")
      .withIndex("by_category_weight", (q) =>
        q.eq("categoryAr", args.categoryAr).eq("weightGrams", args.weightGrams)
      )
      .first();
  },
});

export const upsert = mutation({
  args: {
    categoryAr: v.string(),
    weightGrams: v.number(),
    markupEgp: v.number(),
    cashbackPackagedEgp: v.number(),
    cashbackUnpackagedEgp: v.number(),
    karat: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    validatePositive(args.weightGrams, "weightGrams");
    validatePositive(args.markupEgp, "markupEgp");
    validatePositive(args.cashbackPackagedEgp, "cashbackPackagedEgp");
    validatePositive(args.cashbackUnpackagedEgp, "cashbackUnpackagedEgp");
    validateKarat(args.karat);

    const existing = await ctx.db
      .query("btcPrices")
      .withIndex("by_category_weight", (q) =>
        q.eq("categoryAr", args.categoryAr).eq("weightGrams", args.weightGrams)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        markupEgp: args.markupEgp,
        cashbackPackagedEgp: args.cashbackPackagedEgp,
        cashbackUnpackagedEgp: args.cashbackUnpackagedEgp,
        karat: args.karat,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("btcPrices", args);
    }
  },
});

export const bulkUpsert = internalMutation({
  args: {
    items: v.array(
      v.object({
        categoryAr: v.string(),
        weightGrams: v.number(),
        markupEgp: v.number(),
        cashbackPackagedEgp: v.number(),
        cashbackUnpackagedEgp: v.number(),
        karat: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const item of args.items) {
      validatePositive(item.weightGrams, "weightGrams");
      validatePositive(item.markupEgp, "markupEgp");
      validateKarat(item.karat);

      const existing = await ctx.db
        .query("btcPrices")
        .withIndex("by_category_weight", (q) =>
          q.eq("categoryAr", item.categoryAr).eq("weightGrams", item.weightGrams)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          markupEgp: item.markupEgp,
          cashbackPackagedEgp: item.cashbackPackagedEgp,
          cashbackUnpackagedEgp: item.cashbackUnpackagedEgp,
          karat: item.karat,
        });
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("btcPrices", item);
        ids.push(id);
      }
    }
    return ids;
  },
});

export const deleteAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("btcPrices").collect();
    for (const item of all) {
      await ctx.db.delete(item._id);
    }
    return all.length;
  },
});
