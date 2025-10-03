import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import { ListingVariation } from "../types";

const listingGenerationPrompt = `
You are an expert eBay marketplace listing generator. Your most critical task is to provide accurate, market-driven pricing based on real data.

**Pricing Instructions (Follow Strictly):**
1.  **Prioritize eBay Sold Listings:** Your pricing analysis MUST be based on RECENTLY SOLD listings on eBay. Use the provided Google Search tool with specific queries like "sold eBay listings for [item name]" or "completed listings price for [item name]".
2.  **Ignore Active Listings for Pricing:** Do NOT base your pricing on active, unsold listings, as they do not represent true market value.
3.  **Justify with Data:** Your 'justification' for the pricing MUST explicitly reference your analysis of sold items. For example, mention the price range you observed in sold listings.
4.  **Cite Your Sources:** The 'sources' you provide MUST be direct links to the comparable SOLD listings you used for your analysis whenever possible.

Based on the provided images, user query, and the strict pricing instructions above, generate 3 distinct listing variations.
For each variation, you must provide:
- A compelling title.
- A detailed and appealing description.
- A relevant category.
- A price suggestion with three tiers: 'quickSale', 'marketValue', and 'premium'.
- A data-driven justification for your pricing.
- Content for an eBay listing (title and HTML description).
- Content for a post on X (formerly Twitter).

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
  userQuery: string
): Promise<ListingVariation[]> => {
  // Fix: API key is now sourced exclusively from environment variables as per guidelines.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in environment variables.");
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
