"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const scanTag = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (_, args) => {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_CLOUD_VISION_API_KEY not configured");
    }

    const base64Data = args.imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [{ type: "TEXT_DETECTION", maxResults: 10 }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vision API error: ${error}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations || [];
    const fullText = textAnnotations[0]?.description || "";

    const parsed = parseTagText(fullText);

    return {
      rawText: fullText,
      parsed,
    };
  },
});

function parseTagText(text: string): {
  weight?: number;
  karat?: number;
  sku?: string;
  cogs?: number;
} {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: { weight?: number; karat?: number; sku?: string; cogs?: number } = {};

  for (const line of lines) {
    const weightMatch = line.match(/(\d+[.,]\d+)\s*(?:g|gr|gram)/i);
    if (weightMatch) {
      result.weight = parseFloat(weightMatch[1].replace(",", "."));
    }

    const karatMatch = line.match(/(\d{2})\s*[kK]/);
    if (karatMatch) {
      const k = parseInt(karatMatch[1]);
      if (k === 18 || k === 21 || k === 24) {
        result.karat = k;
      }
    }

    const skuMatch = line.match(/\b(\d{6,10})\b/);
    if (skuMatch && !result.sku) {
      result.sku = skuMatch[1];
    }

    const cogsMatch = line.match(/(\d+[.,]?\d*)\s*(?:USD|EGP|\$|ج\.م)/i);
    if (cogsMatch) {
      result.cogs = parseFloat(cogsMatch[1].replace(",", "."));
    }
  }

  return result;
}
