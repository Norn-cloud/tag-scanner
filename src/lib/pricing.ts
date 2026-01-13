import {
  GOLD_CONFIG,
  type Item,
  type GoldPrices,
  type TransactionContext,
  type TransactionTotals,
} from "./config";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundUp(value: number, nearest: number): number {
  return Math.ceil(value / nearest) * nearest;
}

function roundDown(value: number, nearest: number): number {
  return Math.floor(value / nearest) * nearest;
}

function getGoldPrice(prices: GoldPrices, karat: 18 | 21 | 24): number {
  return prices[`k${karat}` as keyof GoldPrices] || 0;
}

function getItemGoldValue(item: Item, goldPrices: GoldPrices): number {
  if (item.weightGrams <= 0) return 0;
  return getGoldPrice(goldPrices, item.karat) * item.weightGrams;
}

function getItemCogs(item: Item, fxRate: number): number {
  if (item.weightGrams <= 0) return 0;
  
  if (item.condition === "USED") {
    return GOLD_CONFIG.usedGold.avgCogsEgp * item.weightGrams;
  }
  
  if (item.origin === "IT") {
    const cogsUsd = item.cogsFromTag ?? GOLD_CONFIG.italianCogsUsd;
    return cogsUsd * fxRate * item.weightGrams;
  }
  
  if (item.origin === "LX") {
    return (item.cogsFromTag ?? GOLD_CONFIG.luxCogsEgp) * item.weightGrams;
  }
  
  return (item.cogsFromTag ?? GOLD_CONFIG.egyptianCogsEgp) * item.weightGrams;
}

function getItemMarkup(item: Item): number {
  if (item.weightGrams <= 0) return 0;
  
  if (item.condition === "USED") {
    return GOLD_CONFIG.usedGold.avgMarkupEgp * item.weightGrams;
  }
  
  const baseMarkup = GOLD_CONFIG.standardMarkupEgp;
  const multiplier = item.isLightPiece ? GOLD_CONFIG.lightPieceMarkupMultiplier : 1;
  return baseMarkup * multiplier * item.weightGrams;
}

function normalizeContext(ctx: TransactionContext): TransactionContext {
  return {
    ...ctx,
    deductionPercent: clamp(ctx.deductionPercent, GOLD_CONFIG.deduction.min, GOLD_CONFIG.deduction.max),
    markupMultiplier: clamp(ctx.markupMultiplier, GOLD_CONFIG.markup.min, GOLD_CONFIG.markup.max),
  };
}

export function calculateTransactionTotals(
  items: Item[],
  rawCtx: TransactionContext
): TransactionTotals {
  const ctx = normalizeContext(rawCtx);
  
  const outItems = items.filter(i => i.direction === "OUT");
  const inItems = items.filter(i => i.direction === "IN");
  
  const outGoldValue = outItems.reduce((sum, i) => sum + getItemGoldValue(i, ctx.goldPrices), 0);
  const outCogs = outItems.reduce((sum, i) => sum + getItemCogs(i, ctx.fxRate), 0);
  const outMarkup = outItems.reduce((sum, i) => sum + getItemMarkup(i), 0);
  
  const inGoldValue = inItems.reduce((sum, i) => sum + getItemGoldValue(i, ctx.goldPrices), 0);
  
  const outPremium = outCogs + outMarkup;
  const adjustedPremium = outPremium * ctx.markupMultiplier;
  const adjustedOutPrice = roundUp(outGoldValue + adjustedPremium, GOLD_CONFIG.rounding.nearest);
  
  const deduction = ctx.type === "TRADE" ? GOLD_CONFIG.deduction.trade : ctx.deductionPercent;
  const inPrice = roundDown(inGoldValue * (1 - deduction), GOLD_CONFIG.rounding.nearest);
  
  const totalOut = adjustedOutPrice;
  const totalIn = inPrice;
  
  let margin: number;
  let marginPercent: number;
  
  switch (ctx.type) {
    case "SELL":
      margin = totalOut - outGoldValue - outCogs;
      marginPercent = totalOut > 0 ? (margin / totalOut) * 100 : 0;
      break;
    case "BUY":
      margin = inGoldValue - totalIn;
      marginPercent = inGoldValue > 0 ? (margin / inGoldValue) * 100 : 0;
      break;
    case "TRADE":
      margin = totalOut - totalIn - outCogs;
      marginPercent = totalOut > 0 ? (margin / totalOut) * 100 : 0;
      break;
    case "FIX":
      const fixFees = items.reduce((sum, i) => sum + (i.fixFee ?? GOLD_CONFIG.fixes.defaultEgp), 0);
      const addedGoldCost = items.reduce((sum, i) => {
        const addedWeight = i.weightAddedGrams ?? 0;
        return sum + getGoldPrice(ctx.goldPrices, i.karat) * addedWeight;
      }, 0);
      margin = fixFees;
      marginPercent = 100;
      return {
        totalGoldValue: addedGoldCost,
        totalCogs: 0,
        totalMarkup: 0,
        totalPremium: fixFees,
        basePrice: fixFees + addedGoldCost,
        adjustedPrice: fixFees + addedGoldCost,
        floor: addedGoldCost,
        totalIn: 0,
        totalOut: fixFees + addedGoldCost,
        netAmount: fixFees + addedGoldCost,
        margin: fixFees,
        marginPercent: 100,
      };
    default:
      margin = 0;
      marginPercent = 0;
  }
  
  const floor = outGoldValue;
  const netAmount = totalOut - totalIn;
  
  return {
    totalGoldValue: outGoldValue + inGoldValue,
    totalCogs: outCogs,
    totalMarkup: outMarkup,
    totalPremium: outPremium,
    basePrice: outGoldValue + outPremium,
    adjustedPrice: adjustedOutPrice,
    floor,
    totalIn,
    totalOut,
    netAmount,
    margin,
    marginPercent,
  };
}

export function getItemDisplayPrice(item: Item, rawCtx: TransactionContext): number {
  const ctx = normalizeContext(rawCtx);
  const goldValue = getItemGoldValue(item, ctx.goldPrices);
  
  if (item.category === "FIX") {
    const fixFee = item.fixFee ?? GOLD_CONFIG.fixes.defaultEgp;
    const addedGoldCost = (item.weightAddedGrams ?? 0) * getGoldPrice(ctx.goldPrices, item.karat);
    return fixFee + addedGoldCost;
  }
  
  if (item.direction === "IN") {
    const deduction = ctx.type === "TRADE" ? GOLD_CONFIG.deduction.trade : ctx.deductionPercent;
    return roundDown(goldValue * (1 - deduction), GOLD_CONFIG.rounding.nearest);
  }
  
  const cogs = getItemCogs(item, ctx.fxRate);
  const markup = getItemMarkup(item);
  const premium = (cogs + markup) * ctx.markupMultiplier;
  return roundUp(goldValue + premium, GOLD_CONFIG.rounding.nearest);
}

export function getWarningLevel(
  totals: TransactionTotals,
  type: TransactionContext["type"]
): "safe" | "warning" | "danger" | "loss" {
  if (type === "BUY") {
    if (totals.marginPercent < 1) return "danger";
    if (totals.marginPercent < 2) return "warning";
    return "safe";
  }
  
  if (type === "FIX") {
    return "safe";
  }
  
  const { adjustedPrice, floor, basePrice } = totals;
  
  if (adjustedPrice < floor) return "loss";
  if (adjustedPrice < floor * 1.02) return "danger";
  if (adjustedPrice < basePrice * 0.95) return "warning";
  return "safe";
}
