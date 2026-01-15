"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Replicate from "replicate";

// Easy model switching - just change this
const OCR_MODEL = "openai/gpt-4o-mini" as const;

// Alternative models (uncomment to switch):
// const OCR_MODEL = "lucataco/deepseek-ocr" as const;  // Specialized OCR, $0.014/run
// const OCR_MODEL = "google/gemini-2.5-flash" as const;  // Fast, good quality
// const OCR_MODEL = "anthropic/claude-3.5-sonnet" as const;  // Best quality, pricier

const PROMPT = `Extract jewelry tag information from this image.

Look for and extract:
- weight: Weight in grams (e.g., 3.45). Look for "W 3.45" or "3,45 gr" patterns
- karat: Gold purity - 18, 21, or 24. Look for "K21", "21K", "750" (18K), "875" (21K), "999" (24K)
- origin: Origin code near barcode - IT (Italian), EG (Egyptian), LX (Lux), T (treat as Italian)
- sku: Product code/barcode number, usually 6-10 digits
- cogs: Cost/price number, usually bottom right of tag

Respond with ONLY valid JSON in this exact format:
{"weight": 3.45, "karat": 21, "origin": "IT", "sku": "123456", "cogs": 150}

Use null for any field not clearly visible. Numbers should be numbers, not strings.`;

export const scanTag = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (_, args) => {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      throw new Error("REPLICATE_API_TOKEN not configured");
    }

    console.log("OCR: Starting scan with model:", OCR_MODEL);
    console.log("OCR: Image size:", args.imageBase64.length);

    const replicate = new Replicate({ auth: apiKey });

    // Ensure proper data URI format
    let imageUri = args.imageBase64;
    if (!imageUri.startsWith("data:")) {
      imageUri = `data:image/jpeg;base64,${imageUri}`;
    }

    try {
      const output = await replicate.run(OCR_MODEL, {
        input: {
          prompt: PROMPT,
          image: imageUri,
          max_tokens: 500,
        },
      });

      console.log("OCR: Raw output:", output);

      // Handle different output formats from different models
      let responseText = "";
      if (typeof output === "string") {
        responseText = output;
      } else if (Array.isArray(output)) {
        responseText = output.join("");
      } else if (output && typeof output === "object") {
        responseText = JSON.stringify(output);
      }

      console.log("OCR: Response text:", responseText);

      // Extract JSON from response (models sometimes wrap it in markdown)
      let parsed: { weight?: number; karat?: number; origin?: string; sku?: string; cogs?: number } = {};
      
      try {
        // Try to find JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const json = JSON.parse(jsonMatch[0]);
          parsed = {
            weight: typeof json.weight === "number" ? json.weight : undefined,
            karat: typeof json.karat === "number" ? json.karat : undefined,
            origin: typeof json.origin === "string" ? json.origin : undefined,
            sku: typeof json.sku === "string" ? json.sku : undefined,
            cogs: typeof json.cogs === "number" ? json.cogs : undefined,
          };
        }
      } catch (e) {
        console.log("OCR: Failed to parse JSON response:", e);
        parsed = {};
      }

      console.log("OCR: Parsed result:", parsed);

      return {
        rawText: responseText,
        parsed,
      };
    } catch (error) {
      console.error("OCR: Replicate API error:", error);
      throw error;
    }
  },
});
