"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const tagSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    weight: {
      type: SchemaType.NUMBER as const,
      description: "Weight in grams (e.g., 3.45). Extract from text like '3.45g' or '3,45 gr'",
      nullable: true,
    },
    karat: {
      type: SchemaType.NUMBER as const,
      description: "Gold purity: 18, 21, or 24. Extract from text like '21K' or '21 karat'",
      nullable: true,
    },
    sku: {
      type: SchemaType.STRING as const,
      description: "Product code/barcode, usually 6-10 digits",
      nullable: true,
    },
    cogs: {
      type: SchemaType.NUMBER as const,
      description: "Cost/price in any currency. Extract number only",
      nullable: true,
    },
  },
  required: ["weight", "karat", "sku", "cogs"],
} satisfies import("@google/generative-ai").ObjectSchema;

export const scanTag = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (_, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: tagSchema,
      },
    });

    const base64Data = args.imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Extract jewelry tag information from this image. 
Look for: weight (in grams), karat (18/21/24), SKU/barcode, and price/cost.
Return null for any field not clearly visible.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      },
    ]);

    const response = result.response.text();
    
    let parsed: { weight?: number; karat?: number; sku?: string; cogs?: number } = {};
    
    try {
      const json = JSON.parse(response);
      parsed = {
        weight: json.weight ?? undefined,
        karat: json.karat ?? undefined,
        sku: json.sku ?? undefined,
        cogs: json.cogs ?? undefined,
      };
    } catch {
      parsed = {};
    }

    return {
      rawText: response,
      parsed,
    };
  },
});
