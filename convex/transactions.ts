import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, validatePositive } from "./lib/auth";

const statusValidator = v.union(
  v.literal("DRAFT"),
  v.literal("COMPLETED"),
  v.literal("CANCELLED")
);

const typeValidator = v.union(
  v.literal("SELL"),
  v.literal("BUY"),
  v.literal("TRADE"),
  v.literal("FIX")
);

export const list = query({
  args: { status: v.optional(statusValidator) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    if (args.status) {
      return await ctx.db
        .query("transactions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    }
    return await ctx.db.query("transactions").order("desc").take(100);
  },
});

export const get = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getWithItems = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx) return null;

    const items = await ctx.db
      .query("items")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.id))
      .collect();

    return { ...tx, items };
  },
});

export const create = mutation({
  args: {
    type: typeValidator,
    deductionPercent: v.number(),
    goldPricePerGram: v.object({
      k18: v.number(),
      k21: v.number(),
      k24: v.number(),
    }),
    fxRateUsdToEgp: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    validatePositive(args.deductionPercent, "deductionPercent");
    validatePositive(args.fxRateUsdToEgp, "fxRateUsdToEgp");
    validatePositive(args.goldPricePerGram.k18, "goldPricePerGram.k18");
    validatePositive(args.goldPricePerGram.k21, "goldPricePerGram.k21");
    validatePositive(args.goldPricePerGram.k24, "goldPricePerGram.k24");

    if (args.deductionPercent > 1) {
      throw new Error("deductionPercent should be a decimal (e.g., 0.02 for 2%)");
    }

    return await ctx.db.insert("transactions", {
      ...args,
      status: "DRAFT",
      totalIn: 0,
      totalOut: 0,
      netAmount: 0,
      totalMargin: 0,
      marginPercent: 0,
    });
  },
});

export const recalcTotals = internalMutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("Transaction not found");

    const items = await ctx.db
      .query("items")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.id))
      .collect();

    let totalIn = 0;
    let totalOut = 0;
    let totalCogs = 0;

    for (const item of items) {
      const price = item.adjustedPrice || item.calculatedPrice;
      if (item.direction === "IN") {
        totalIn += price;
      } else {
        totalOut += price;
      }

      const karatKey = `k${item.karat}` as keyof typeof tx.goldPricePerGram;
      const goldPrice = tx.goldPricePerGram[karatKey];
      totalCogs += goldPrice * item.weightGrams;
    }

    const netAmount = totalOut - totalIn;
    const totalMargin = totalOut - totalCogs;
    const marginPercent = totalOut > 0 ? (totalMargin / totalOut) * 100 : 0;

    await ctx.db.patch(args.id, {
      totalIn,
      totalOut,
      netAmount,
      totalMargin,
      marginPercent,
    });
  },
});

export const complete = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("Transaction not found");
    if (tx.status !== "DRAFT") {
      throw new Error("Can only complete DRAFT transactions");
    }

    const items = await ctx.db
      .query("items")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.id))
      .collect();

    if (items.length === 0) {
      throw new Error("Cannot complete transaction with no items");
    }

    await ctx.db.patch(args.id, { status: "COMPLETED" });
  },
});

export const cancel = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx) throw new Error("Transaction not found");
    if (tx.status !== "DRAFT") {
      throw new Error("Can only cancel DRAFT transactions");
    }
    await ctx.db.patch(args.id, { status: "CANCELLED" });
  },
});
