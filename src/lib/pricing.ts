import {
  GOLD_CONFIG,
  type Item,
  type Transaction,
  type GoldPrices,
  type BtcPriceData,
} from "./config";

export function roundUp(value: number, nearest: number): number {
  return Math.ceil(value / nearest) * nearest;
}

export function roundDown(value: number, nearest: number): number {
  return Math.floor(value / nearest) * nearest;
}

export function getGoldPrice(prices: GoldPrices, karat: 18 | 21 | 24): number {
  const key = `k${karat}` as keyof GoldPrices;
  return prices[key];
}

export function calculateSellPrice(
  item: Item,
  goldPrices: GoldPrices,
  fxRate: number,
  btcLookup?: (category: string, weight: number) => BtcPriceData | undefined
): number {
  const goldPrice = getGoldPrice(goldPrices, item.karat);

  if (item.source === "BTC" && btcLookup) {
    const btcData = btcLookup(item.category, item.weightGrams);
    if (btcData) {
      return (goldPrice + btcData.markupEgp) * item.weightGrams;
    }
  }

  let cogs: number;
  let markup: number;

  const isUsed = item.condition === "USED";

  if (isUsed) {
    cogs = GOLD_CONFIG.usedGold.avgCogsEgp;
    markup = GOLD_CONFIG.usedGold.avgMarkupEgp;
  } else if (item.origin === "IT") {
    cogs = (item.cogsFromTag ?? GOLD_CONFIG.italianCogsUsd) * fxRate;
    markup = item.isLightPiece
      ? GOLD_CONFIG.standardMarkupEgp * GOLD_CONFIG.lightPieceMarkupMultiplier
      : GOLD_CONFIG.standardMarkupEgp;
  } else {
    cogs = item.cogsFromTag ?? GOLD_CONFIG.usedGold.avgCogsEgp;
    markup = item.isLightPiece
      ? GOLD_CONFIG.standardMarkupEgp * GOLD_CONFIG.lightPieceMarkupMultiplier
      : GOLD_CONFIG.standardMarkupEgp;
  }

  const rawPrice = (goldPrice + cogs + markup) * item.weightGrams;
  return roundUp(rawPrice, GOLD_CONFIG.rounding.nearest);
}

export function calculateBuyPrice(
  item: Item,
  goldPrices: GoldPrices,
  deductionPercent: number,
  btcLookup?: (category: string, weight: number) => BtcPriceData | undefined
): number {
  const goldPrice = getGoldPrice(goldPrices, item.karat);

  if (item.source === "BTC" && btcLookup) {
    const btcData = btcLookup(item.category, item.weightGrams);
    if (btcData) {
      const cashback = item.isPackagedBtc
        ? btcData.cashbackPackagedEgp
        : btcData.cashbackUnpackagedEgp;
      return (goldPrice - cashback) * item.weightGrams;
    }
  }

  const baseValue = goldPrice * item.weightGrams;
  const afterDeduction = baseValue * (1 - deductionPercent);
  return roundDown(afterDeduction, GOLD_CONFIG.rounding.nearest);
}

export function calculateFixPrice(
  item: Item,
  goldPrices: GoldPrices,
  fixFee: number,
  weightAddedGrams: number = 0
): number {
  const goldPrice = getGoldPrice(goldPrices, item.karat);
  const addedGoldCost = weightAddedGrams * goldPrice;
  return fixFee + addedGoldCost;
}

export function calculateItemPrice(
  item: Item,
  tx: Transaction,
  btcLookup?: (category: string, weight: number) => BtcPriceData | undefined
): number {
  switch (tx.type) {
    case "SELL":
      return calculateSellPrice(item, tx.goldPricePerGram, tx.fxRateUsdToEgp, btcLookup);

    case "BUY":
      return calculateBuyPrice(item, tx.goldPricePerGram, tx.deductionPercent, btcLookup);

    case "TRADE":
      if (item.direction === "OUT") {
        return calculateSellPrice(item, tx.goldPricePerGram, tx.fxRateUsdToEgp, btcLookup);
      }
      return calculateBuyPrice(item, tx.goldPricePerGram, 0, btcLookup);

    case "FIX":
      return calculateFixPrice(item, tx.goldPricePerGram, GOLD_CONFIG.fixes.defaultEgp);

    default:
      return 0;
  }
}

export function calculateTransactionTotals(tx: Transaction): {
  totalIn: number;
  totalOut: number;
  netAmount: number;
  totalMargin: number;
  marginPercent: number;
} {
  let totalIn = 0;
  let totalOut = 0;
  let totalCogs = 0;

  for (const item of tx.items) {
    const price = item.adjustedPrice || item.calculatedPrice;

    if (item.direction === "IN") {
      totalIn += price;
    } else {
      totalOut += price;
    }

    const goldPrice = getGoldPrice(tx.goldPricePerGram, item.karat);
    totalCogs += goldPrice * item.weightGrams;
  }

  const netAmount = totalOut - totalIn;
  const totalMargin = totalOut - totalCogs;
  const marginPercent = totalOut > 0 ? (totalMargin / totalOut) * 100 : 0;

  return {
    totalIn,
    totalOut,
    netAmount,
    totalMargin,
    marginPercent,
  };
}

export function getCogsFloor(item: Item, goldPrices: GoldPrices): number {
  const goldPrice = getGoldPrice(goldPrices, item.karat);
  return goldPrice * item.weightGrams;
}

export function getPriceWarningLevel(
  item: Item,
  goldPrices: GoldPrices
): "safe" | "warning" | "danger" | "loss" {
  const floor = getCogsFloor(item, goldPrices);
  const price = item.adjustedPrice || item.calculatedPrice;
  const recommended = item.calculatedPrice;

  if (price < floor) return "loss";
  if (price < floor * 1.05) return "danger";
  if (price < recommended * 0.9) return "warning";
  return "safe";
}
