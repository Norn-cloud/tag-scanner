import { action } from "./_generated/server";
import { api } from "./_generated/api";

const CURRENCY_API_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";

const CURRENCY_API_FALLBACK =
  "https://latest.currency-api.pages.dev/v1/currencies/usd.json";

const TROY_OZ_TO_GRAMS = 31.1035;

interface CurrencyApiResponse {
  date: string;
  usd: {
    xau: number;
    egp: number;
  };
}

export const fetchPrices = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    goldPrices?: { k18: number; k21: number; k24: number };
    fxRate?: number;
    error?: string;
  }> => {
    let data: CurrencyApiResponse;

    try {
      const response = await fetch(CURRENCY_API_URL);
      if (!response.ok) throw new Error(`Primary API failed: ${response.status}`);
      data = await response.json();
    } catch {
      try {
        const fallbackResponse = await fetch(CURRENCY_API_FALLBACK);
        if (!fallbackResponse.ok) throw new Error(`Fallback API failed: ${fallbackResponse.status}`);
        data = await fallbackResponse.json();
      } catch (fallbackError) {
        return { success: false, error: `Failed to fetch prices: ${fallbackError}` };
      }
    }

    if (!data.usd?.xau || !data.usd?.egp) {
      return { success: false, error: "Invalid API response: missing xau or egp" };
    }

    const xau = data.usd.xau;
    const egp = data.usd.egp;

    if (!Number.isFinite(xau) || xau <= 0 || !Number.isFinite(egp) || egp <= 0) {
      return { success: false, error: "Invalid API response: xau or egp out of range" };
    }

    if (egp < 10 || egp > 200) {
      return { success: false, error: `FX rate ${egp} seems unrealistic` };
    }

    const goldUsdPerOz = 1 / xau;
    const goldUsdPerGram = goldUsdPerOz / TROY_OZ_TO_GRAMS;
    const fxRate = egp;

    const gold24kEgp = goldUsdPerGram * fxRate;
    const pricePerGram24K = Math.round(gold24kEgp);
    const pricePerGram21K = Math.round(gold24kEgp * (21 / 24));
    const pricePerGram18K = Math.round(gold24kEgp * (18 / 24));

    await ctx.runMutation(api.goldPrices.set, {
      pricePerGram18K,
      pricePerGram21K,
      pricePerGram24K,
      source: "fawazahmed0-currency-api",
      manualOverride: false,
    });

    const roundedFxRate = Math.round(fxRate * 100) / 100;
    await ctx.runMutation(api.fxRate.set, {
      usdToEgp: roundedFxRate,
      source: "fawazahmed0-currency-api",
      manualOverride: false,
    });

    return {
      success: true,
      goldPrices: { k18: pricePerGram18K, k21: pricePerGram21K, k24: pricePerGram24K },
      fxRate: roundedFxRate,
    };
  },
});
