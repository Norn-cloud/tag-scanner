"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const tagSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    weight: {
      type: SchemaType.NUMBER as const,
      description: "Weight in grams (e.g., 3.45). Extract from text like 'W 3.45' or '3,45 gr'",
      nullable: true,
    },
    karat: {
      type: SchemaType.NUMBER as const,
      description: "Gold purity: 18, 21, or 24. Extract from text like 'K21' or '21K'",
      nullable: true,
    },
    origin: {
      type: SchemaType.STRING as const,
      description: "Origin code: IT (Italian), EG (Egyptian), LX (Lux), T (treat as IT). Look near barcode",
      nullable: true,
    },
    sku: {
      type: SchemaType.STRING as const,
      description: "Product code/barcode number, usually 6-10 digits",
      nullable: true,
    },
    cogs: {
      type: SchemaType.NUMBER as const,
      description: "Cost/price number, usually bottom right of tag. Extract number only",
      nullable: true,
    },
  },
  required: ["weight", "karat", "origin", "sku", "cogs"],
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

    console.log("OCR: Starting scan, image size:", args.imageBase64.length);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: tagSchema,
      },
    });

    const base64Data = args.imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Extract jewelry tag information from this image. 
Look for: weight (in grams), karat (18/21/24), SKU/barcode, and price/cost.
Return null for any field not clearly visible.`;

    console.log("OCR: Calling Gemini API...");
    
    try {
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
      console.log("OCR: Gemini response:", response);
      
      let parsed: { weight?: number; karat?: number; origin?: string; sku?: string; cogs?: number } = {};
      
      try {
        const json = JSON.parse(response);
        parsed = {
          weight: json.weight ?? undefined,
          karat: json.karat ?? undefined,
          origin: json.origin ?? undefined,
          sku: json.sku ?? undefined,
          cogs: json.cogs ?? undefined,
        };
      } catch {
        console.log("OCR: Failed to parse JSON response");
        parsed = {};
      }

      return {
        rawText: response,
        parsed,
      };
    } catch (error) {
      console.error("OCR: Gemini API error:", error);
      throw error;
    }
  },
});
