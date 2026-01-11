import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transactions: defineTable({
    type: v.union(
      v.literal("SELL"),
      v.literal("BUY"),
      v.literal("TRADE"),
      v.literal("FIX")
    ),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
    deductionPercent: v.number(),
    goldPricePerGram: v.object({
      k18: v.number(),
      k21: v.number(),
      k24: v.number(),
    }),
    fxRateUsdToEgp: v.number(),
    totalIn: v.number(),
    totalOut: v.number(),
    netAmount: v.number(),
    totalMargin: v.number(),
    marginPercent: v.number(),
    userId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  items: defineTable({
    transactionId: v.id("transactions"),
    origin: v.union(
      v.literal("IT"),
      v.literal("EG"),
      v.literal("LX"),
      v.literal("USED")
    ),
    weightGrams: v.number(),
    karat: v.union(v.literal(18), v.literal(21), v.literal(24)),
    cogsFromTag: v.optional(v.number()),
    sku: v.optional(v.string()),
    category: v.union(
      v.literal("JEWELRY"),
      v.literal("COIN"),
      v.literal("INGOT"),
      v.literal("FIX")
    ),
    source: v.optional(v.union(v.literal("BTC"), v.literal("OTHER"))),
    isLightPiece: v.boolean(),
    isPackagedBtc: v.optional(v.boolean()),
    calculatedPrice: v.number(),
    adjustedPrice: v.number(),
    isLocked: v.boolean(),
    tagImageId: v.optional(v.id("_storage")),
    direction: v.union(v.literal("IN"), v.literal("OUT")),
  }).index("by_transaction", ["transactionId"]),

  btcPrices: defineTable({
    categoryAr: v.string(),
    weightGrams: v.number(),
    markupEgp: v.number(),
    cashbackPackagedEgp: v.number(),
    cashbackUnpackagedEgp: v.number(),
    karat: v.number(),
  }).index("by_category_weight", ["categoryAr", "weightGrams"]),

  goldPriceCache: defineTable({
    pricePerGram18K: v.number(),
    pricePerGram21K: v.number(),
    pricePerGram24K: v.number(),
    source: v.string(),
    fetchedAtMs: v.number(),
    manualOverride: v.boolean(),
  }),

  fxRateCache: defineTable({
    usdToEgp: v.number(),
    source: v.string(),
    fetchedAtMs: v.number(),
    manualOverride: v.boolean(),
  }),

  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(v.literal("ADMIN"), v.literal("SELLER")),
  }).index("by_email", ["email"]),
});
