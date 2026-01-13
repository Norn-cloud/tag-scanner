export const GOLD_CONFIG = {
  italianCogsUsd: 50,
  egyptianCogsEgp: 100,
  luxCogsEgp: 120,
  
  lightPieceMarkupMultiplier: 2.0,
  standardMarkupEgp: 150,
  
  usedGold: {
    avgCogsEgp: 150,
    avgMarkupEgp: 100,
  },
  
  deduction: {
    default: 0.02,
    min: 0.00,
    max: 0.03,
    trade: 0.00,
  },
  
  markup: {
    min: 0.5,
    max: 1.5,
    default: 1.0,
  },
  
  fixes: {
    minEgp: 250,
    maxEgp: 500,
    defaultEgp: 350,
  },
  
  rounding: {
    nearest: 10,
  },
  
  goldPriceMaxAgeHours: 24,
  
  defaultKarat: {
    jewelry: 18 as const,
    coin: 21 as const,
    ingot: 24 as const,
  },
} as const;

export type Origin = "IT" | "EG" | "LX" | "USED";
export type Condition = "NEW" | "USED";
export type Karat = 18 | 21 | 24;
export type TransactionType = "SELL" | "BUY" | "TRADE" | "FIX";
export type ItemCategory = "JEWELRY" | "COIN" | "INGOT" | "FIX";
export type ItemSource = "BTC" | "OTHER";
export type Direction = "IN" | "OUT";

export interface Item {
  id: string;
  origin: Origin;
  condition: Condition;
  weightGrams: number;
  karat: Karat;
  cogsFromTag?: number;
  sku?: string;
  category: ItemCategory;
  source?: ItemSource;
  isLightPiece: boolean;
  isPackagedBtc?: boolean;
  tagImageUrl?: string;
  direction: Direction;
  fixFee?: number;
  weightAddedGrams?: number;
}

export interface GoldPrices {
  k18: number;
  k21: number;
  k24: number;
}

export interface TransactionContext {
  type: TransactionType;
  goldPrices: GoldPrices;
  fxRate: number;
  deductionPercent: number;
  markupMultiplier: number;
}

export interface TransactionTotals {
  totalGoldValue: number;
  totalCogs: number;
  totalMarkup: number;
  totalPremium: number;
  basePrice: number;
  adjustedPrice: number;
  floor: number;
  totalIn: number;
  totalOut: number;
  netAmount: number;
  margin: number;
  marginPercent: number;
}

export interface BtcPriceData {
  categoryAr: string;
  weightGrams: number;
  markupEgp: number;
  cashbackPackagedEgp: number;
  cashbackUnpackagedEgp: number;
  karat: number;
}
