import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import { Listing } from "../types";

// Define schema for cited sources
const sourceSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The title of the comparable sold listing."
        },
        url: {
            type: Type.STRING,
            description: "The direct URL to the comparable sold listing."
        }
    },
    required: ["title", "url"],
};

// Define schema for detailed price suggestions
const priceSuggestionSchema = {
    type: Type.OBJECT,
    description: "A detailed price suggestion based on market analysis of sold items.",
    properties: {
        quickSale: {
            type: Type.NUMBER,
            description: "A competitive price for a quick sale.",
        },
        marketValue: {
            type: Type.NUMBER,
            description: "The fair market value for the item.",
        },
        premium: {
            type: Type.NUMBER,
            description: "A premium price for a patient seller with a high-quality item.",
        },
        justification: {
            type: Type.STRING,
            description: "A brief, data-driven justification for the pricing, referencing the condition and comparable sold items. FORBIDDEN from using vague phrases like 'Based on my analysis' or 'Considering the market'. MUST be concrete."
        },
        sources: {
            type: Type.ARRAY,
            description: "An array of 1-3 direct sources (URLs) to comparable *sold* items on platforms like eBay that were used for the analysis.",
            items: sourceSchema,
        }
    },
    required: ["quickSale", "marketValue", "premium", "justification", "sources"],
};


// Define base schema parts to avoid repetition
const baseSchemaProperties = {
  title: {
    type: Type.STRING,
    description: "A compelling, SEO-friendly title for the item. Maximum 80 characters.",
  },
  description: {
    type: Type.STRING,
    description: "A detailed and enticing description of the item, formatted with paragraphs (use '\\n' for new lines). Highlight key features and condition.",
  },
  priceSuggestion: priceSuggestionSchema,
  category: {
    type: Type.STRING,
    description: "A single, relevant category for the item (e.g., 'Electronics', 'Men's Fashion', 'Home Decor').",
  },
};

const ebaySchemaProperty = {
  type: Type.OBJECT,
  description: "Content optimized for an eBay listing.",
  properties: {
    title: {
      type: Type.STRING,
      description: "An eBay-specific, keyword-rich title. Maximum 80 characters.",
    },
    descriptionHtml: {
      type: Type.STRING,
      description: "A well-structured HTML description for the eBay listing. Use headings (<h3>), paragraphs (<p>), and bullet points (<ul><li>) to improve readability.",
    },
  },
  required: ["title", "descriptionHtml"],
};

const twitterSchemaProperty = {
    type: Type.OBJECT,
    description: "Content optimized for a post on X (formerly Twitter).",
    properties: {
        tweet: {
            type: Type.STRING,
            description: "A short, engaging tweet to promote the item. Include relevant hashtags. Maximum 280 characters.",
        },
    },
    required: ["tweet"],
};


// FIX: Removed `geminiApiKey` parameter to adhere to security guidelines.
// The API key should be exclusively managed via environment variables.
export const generateListing = async (
  images: File[],
  notes: string,
  isEbayConfigured: boolean,
  isTwitterConfigured: boolean,
): Promise<Omit<Listing, 'id' | 'createdAt' | 'images'>[]> => {
  // FIX: Use `process.env.API_KEY` directly as per the coding guidelines.
  // This avoids exposing the key management logic to the UI.
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured in environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (images.length === 0) {
    throw new Error("At least one image is required to generate a listing.");
  }
  
  // Dynamically construct schema and a more detailed prompt
  const finalSchemaProperties: any = { ...baseSchemaProperties };
  const finalRequired = ["title", "description", "priceSuggestion", "category"];
  
  let promptInstructions = `Act as an expert marketplace seller and e-commerce analyst. Your task is to generate 3 compelling and distinct variations of a product listing based on the provided images and user notes.

**Mandatory Analysis & Sourcing Instructions:**
1.  **Analyze Market Data & CITE SOURCES:** Your entire analysis MUST be based on *recently sold items* from public marketplaces like eBay. You are REQUIRED to provide 1-3 direct URLs to the comparable *sold listings* you used for your analysis in the 'sources' array.
2.  **Provide Data-Driven Justification:** In the 'justification' field, you MUST explain your pricing strategy by referencing the condition and specific features of the item compared to the sold items you found. DO NOT use generic or vague statements. Be specific. For example: "This is priced slightly higher than the sold item [Source 1] because it includes the original box, which the other did not."
3.  **Determine Condition:** Carefully examine the images and user notes to determine the item's condition. Use standard e-commerce condition keywords in the description (e.g., "New," "Like New," "Used," "Good Condition," "For parts/not working").
4.  **Incorporate User Notes:** Explicitly mention details from the user's notes (e.g., included accessories, noted defects) in the main description.

**User Provided Information:**
-   **Notes:** "${notes || "No additional notes provided."}"

**Output Format & Variation-Specific Instructions:**
-   Generate the response **only** in a JSON array format that adheres to the provided schema. Each object in the array is a listing variation.
-   **Variation 1 (Professional & High-Value):** A premium, detailed listing targeting buyers looking for quality. Use a professional tone. Price it at the 'premium' end.
-   **Variation 2 (Casual & Quick-Sale):** A friendly, concise listing aiming for a fast sale. Use a casual, approachable tone. Price it at the 'quickSale' end.
-   **Variation 3 (Benefit-Focused & Market-Value):** A persuasive listing that highlights key benefits. Price it at the 'marketValue' point.
`;

  const platformInstructions: string[] = [];
  if (isEbayConfigured) {
    finalSchemaProperties.ebay = ebaySchemaProperty;
    finalRequired.push("ebay");
    platformInstructions.push("- For the 'ebay' object, create a keyword-optimized title and a well-structured HTML description for each variation.");
  }
  
  if (isTwitterConfigured) {
    finalSchemaProperties.twitter = twitterSchemaProperty;
    finalRequired.push("twitter");
    platformInstructions.push("- For the 'twitter' object, create a concise, engaging tweet with relevant hashtags for each variation.");
  }

  if (platformInstructions.length > 0) {
    promptInstructions += `\n**Platform-Specific Instructions:**\n${platformInstructions.join('\n')}`;
  }
  
  const listingObjectSchema = {
    type: Type.OBJECT,
    properties: finalSchemaProperties,
    required: finalRequired,
  };

  const listingSchema = {
    type: Type.ARRAY,
    description: "An array of 3 distinct listing variations.",
    items: listingObjectSchema,
  };

  const base64Images = await Promise.all(images.map(fileToBase64));

  const imageParts = base64Images.map((img, index) => ({
    inlineData: {
      mimeType: images[index].type,
      data: img,
    },
  }));

  const textPart = { text: promptInstructions };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [...imageParts, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: listingSchema,
    },
  });

  try {
    const jsonString = response.text;
    const listingData = JSON.parse(jsonString);
    if (!Array.isArray(listingData)) {
      console.error("Gemini response was not an array:", listingData);
      throw new Error("Failed to generate listing variations. The model returned an invalid format.");
    }
    // This is a type assertion. Add runtime validation if needed for robustness.
    return listingData as Omit<Listing, 'id' | 'createdAt' | 'images'>[];
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text, e);
    throw new Error("Failed to generate listing. The model returned an invalid JSON format.");
  }
};


// FIX: Removed `apiKey` parameter. The function now checks for the key in environment variables.
export const verifyGeminiApiKey = async (): Promise<boolean> => {
  // FIX: Check `process.env.API_KEY` instead of a passed-in key.
  if (!process.env.API_KEY) {
    return false;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Make a lightweight, non-streaming call to check for authentication.
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "hello",
    });
    return true;
  } catch (error) {
    console.error("Gemini API key verification failed:", error);
    return false;
  }
};
