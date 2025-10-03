import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import { ListingVariation } from "../types";

const listingGenerationPrompt = `
You are an expert marketplace listing generator. Based on the provided images and user query, generate 3 distinct listing variations.
For each variation, you must provide:
- A compelling title.
- A detailed and appealing description.
- A relevant category.
- A price suggestion with three tiers: 'quickSale', 'marketValue', and 'premium'.
- A justification for your pricing, explaining your rationale.
- Content for an eBay listing (title and HTML description).
- Content for a post on X (formerly Twitter).

You MUST use the provided Google Search tool to find comparable listings and market data to inform your pricing and justification. The sources you find MUST be included in the response.

Respond ONLY with a valid JSON object in a string format. Do not include any other text, markdown, or explanations outside of the JSON object.

The JSON object should be an array of 3 listing variations, matching this structure:
[
  {
    "title": "string",
    "description": "string",
    "category": "string",
    "priceSuggestion": {
      "quickSale": number,
      "marketValue": number,
      "premium": number,
      "justification": "string",
      "sources": [
        {
          "title": "string",
          "url": "string"
        }
      ]
    },
    "ebay": {
      "title": "string",
      "descriptionHtml": "string"
    },
    "twitter": {
      "tweet": "string"
    }
  }
]
`;

export const generateListings = async (
  images: File[],
  userQuery: string,
  apiKey: string
): Promise<ListingVariation[]> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  
  if (images.length === 0) {
    throw new Error("At least one image is required to generate listings.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const imageParts = await Promise.all(
    images.map(async (file) => {
      const base64Data = await fileToBase64(file);
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };
    })
  );

  const textPart = {
    text: `User query: "${userQuery}".\n\n${listingGenerationPrompt}`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [...imageParts, textPart] },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
        .map((chunk: any) => ({
            title: chunk.web?.title || "Source",
            url: chunk.web?.uri || "",
        }))
        .filter((source: any) => source.url);
    
    let jsonString = response.text.trim();
    
    if (jsonString.startsWith("```json")) {
        jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith("```")) {
        jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    
    const variations: ListingVariation[] = JSON.parse(jsonString);

    return variations.map(v => {
        if (!v.priceSuggestion.sources || v.priceSuggestion.sources.length === 0) {
            return {
                ...v,
                priceSuggestion: {
                    ...v.priceSuggestion,
                    sources: sources,
                }
            };
        }
        return v;
    });

  } catch (error) {
    console.error("Error generating listings with Gemini API:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse the response from the AI. The response may not be valid JSON.");
    }
    throw new Error("An error occurred while generating listings. Please check the console for details.");
  }
};

/**
 * Verifies a Gemini API key by making a simple, lightweight API call.
 */
export const verifyGeminiKey = async (apiKey: string): Promise<{ success: boolean; error?: string }> => {
    if (!apiKey) {
        return { success: false, error: "API Key is missing." };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        // A simple, low-cost model call to verify authentication.
        // We just need to see if it throws an auth error.
        await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "hello",
        });
        return { success: true };
    } catch (error: any) {
        console.error("Gemini API key verification failed:", error);
        if (error.message && error.message.includes('API key not valid')) {
            return { success: false, error: "The provided API key is not valid. Please check it and try again." };
        }
        return { success: false, error: "Verification failed. Check the browser console for more details." };
    }
};