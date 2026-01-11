import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAuth, validatePositive } from "./lib/auth";

const originValidator = v.union(
  v.literal("IT"),
  v.literal("EG"),
  v.literal("LX"),
  v.literal("USED")
);

const karatValidator = v.union(v.literal(18), v.literal(21), v.literal(24));

const categoryValidator = v.union(
  v.literal("JEWELRY"),
  v.literal("COIN"),
  v.literal("INGOT"),
  v.literal("FIX")
);

const directionValidator = v.union(v.literal("IN"), v.literal("OUT"));

async function assertDraftTransaction(ctx: { db: any }, transactionId: any) {
  const tx = await ctx.db.get(transactionId);
  if (!tx) throw new Error("Transaction not found");
  if (tx.status !== "DRAFT") {
    throw new Error("Cannot modify items on a completed/cancelled transaction");
  }
  return tx;
}

export const listByTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("items")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();
  },
});

export const add = mutation({
  args: {
    transactionId: v.id("transactions"),
    origin: originValidator,
    weightGrams: v.number(),
    karat: karatValidator,
    cogsFromTag: v.optional(v.number()),
    sku: v.optional(v.string()),
    category: categoryValidator,
    source: v.optional(v.union(v.literal("BTC"), v.literal("OTHER"))),
    isLightPiece: v.boolean(),
    isPackagedBtc: v.optional(v.boolean()),
    calculatedPrice: v.number(),
    adjustedPrice: v.number(),
    direction: directionValidator,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await assertDraftTransaction(ctx, args.transactionId);

    validatePositive(args.weightGrams, "weightGrams");
    validatePositive(args.calculatedPrice, "calculatedPrice");
    validatePositive(args.adjustedPrice, "adjustedPrice");
    if (args.cogsFromTag !== undefined) {
      validatePositive(args.cogsFromTag, "cogsFromTag");
    }

    const id = await ctx.db.insert("items", {
      ...args,
      isLocked: false,
    });

    await ctx.scheduler.runAfter(0, internal.transactions.recalcTotals, {
      id: args.transactionId,
    });

    return id;
  },
});

export const updatePrice = mutation({
  args: {
    id: v.id("items"),
    adjustedPrice: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    if (item.isLocked) throw new Error("Cannot update price on locked item");

    await assertDraftTransaction(ctx, item.transactionId);
    validatePositive(args.adjustedPrice, "adjustedPrice");

    await ctx.db.patch(args.id, { adjustedPrice: args.adjustedPrice });

    await ctx.scheduler.runAfter(0, internal.transactions.recalcTotals, {
      id: item.transactionId,
    });
  },
});

export const toggleLock = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");

    await assertDraftTransaction(ctx, item.transactionId);
    await ctx.db.patch(args.id, { isLocked: !item.isLocked });
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    if (item.isLocked) throw new Error("Cannot remove locked item");

    await assertDraftTransaction(ctx, item.transactionId);
    const transactionId = item.transactionId;

    await ctx.db.delete(args.id);

    await ctx.scheduler.runAfter(0, internal.transactions.recalcTotals, {
      id: transactionId,
    });
  },
});
