import {
  GOLD_CONFIG,
  type Item,
  type GoldPrices,
  type TransactionContext,
  type TransactionTotals,
} from "./config";

function roundUp(value: number, nearest: number): number {
  return Math.ceil(value / nearest) * nearest;
}

function roundDown(value: number, nearest: number): number {
  return Math.floor(value / nearest) * nearest;
}

function getGoldPrice(prices: GoldPrices, karat: 18 | 21 | 24): number {
  return prices[`k${karat}` as keyof GoldPrices];
}

function getItemGoldValue(item: Item, goldPrices: GoldPrices): number {
  return getGoldPrice(goldPrices, item.karat) * item.weightGrams;
}

function getItemCogs(item: Item, fxRate: number): number {
  if (item.condition === "USED") {
    return GOLD_CONFIG.usedGold.avgCogsEgp * item.weightGrams;
  }
  
  if (item.origin === "IT") {
    const cogsUsd = item.cogsFromTag ?? GOLD_CONFIG.italianCogsUsd;
    return cogsUsd * fxRate * item.weightGrams;
  }
  
  return (item.cogsFromTag ?? GOLD_CONFIG.usedGold.avgCogsEgp) * item.weightGrams;
}

function getItemMarkup(item: Item): number {
  if (item.condition === "USED") {
    return GOLD_CONFIG.usedGold.avgMarkupEgp * item.weightGrams;
  }
  
  const baseMarkup = GOLD_CONFIG.standardMarkupEgp;
  const multiplier = item.isLightPiece ? GOLD_CONFIG.lightPieceMarkupMultiplier : 1;
  return baseMarkup * multiplier * item.weightGrams;
}

export function calculateTransactionTotals(
  items: Item[],
  ctx: TransactionContext
): TransactionTotals {
  const outItems = items.filter(i => i.direction === "OUT");
  const inItems = items.filter(i => i.direction === "IN");
  
  const outGoldValue = outItems.reduce((sum, i) => sum + getItemGoldValue(i, ctx.goldPrices), 0);
  const outCogs = outItems.reduce((sum, i) => sum + getItemCogs(i, ctx.fxRate), 0);
  const outMarkup = outItems.reduce((sum, i) => sum + getItemMarkup(i), 0);
  
  const inGoldValue = inItems.reduce((sum, i) => sum + getItemGoldValue(i, ctx.goldPrices), 0);
  
  const baseOutPrice = outGoldValue + outCogs + outMarkup;
  const adjustedOutPrice = roundUp(baseOutPrice * ctx.markupMultiplier, GOLD_CONFIG.rounding.nearest);
  
  const deduction = ctx.type === "TRADE" ? 0 : ctx.deductionPercent;
  const inPrice = roundDown(inGoldValue * (1 - deduction), GOLD_CONFIG.rounding.nearest);
  
  const totalOut = adjustedOutPrice;
  const totalIn = inPrice;
  const netAmount = totalOut - totalIn;
  
  const floor = outGoldValue;
  const margin = adjustedOutPrice - floor;
  const marginPercent = adjustedOutPrice > 0 ? (margin / adjustedOutPrice) * 100 : 0;
  
  return {
    totalGoldValue: outGoldValue + inGoldValue,
    totalCogs: outCogs,
    totalMarkup: outMarkup,
    basePrice: baseOutPrice,
    adjustedPrice: adjustedOutPrice,
    floor,
    totalIn,
    totalOut,
    netAmount,
    margin,
    marginPercent,
  };
}

export function getItemDisplayPrice(item: Item, ctx: TransactionContext): number {
  const goldValue = getItemGoldValue(item, ctx.goldPrices);
  
  if (item.direction === "IN") {
    const deduction = ctx.type === "TRADE" ? 0 : ctx.deductionPercent;
    return roundDown(goldValue * (1 - deduction), GOLD_CONFIG.rounding.nearest);
  }
  
  const cogs = getItemCogs(item, ctx.fxRate);
  const markup = getItemMarkup(item);
  const base = goldValue + cogs + markup;
  return roundUp(base * ctx.markupMultiplier, GOLD_CONFIG.rounding.nearest);
}

export function getWarningLevel(
  totals: TransactionTotals
): "safe" | "warning" | "danger" | "loss" {
  const { adjustedPrice, floor, basePrice } = totals;
  
  if (adjustedPrice < floor) return "loss";
  if (adjustedPrice < floor * 1.05) return "danger";
  if (adjustedPrice < basePrice * 0.9) return "warning";
  return "safe";
}
