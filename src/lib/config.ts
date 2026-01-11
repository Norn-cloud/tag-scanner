export const GOLD_CONFIG = {
  italianCogsUsd: 50,
  
  lightPieceMarkupMultiplier: 2.0,
  standardMarkupEgp: 150,
  
  usedGold: {
    avgCogsEgp: 150,
    avgMarkupEgp: 100,
  },
  
  deduction: {
    default: 0.02,
    min: 0.01,
    max: 0.03,
    trade: 0.00,
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

export type Origin = "IT" | "EG";
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
  calculatedPrice: number;
  adjustedPrice: number;
  isLocked: boolean;
  tagImageUrl?: string;
  direction: Direction;
}

export interface GoldPrices {
  k18: number;
  k21: number;
  k24: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  items: Item[];
  deductionPercent: number;
  goldPricePerGram: GoldPrices;
  fxRateUsdToEgp: number;
  totalIn: number;
  totalOut: number;
  netAmount: number;
  totalMargin: number;
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
