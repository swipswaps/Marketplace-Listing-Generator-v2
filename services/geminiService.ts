import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import { Listing } from "../types";

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
  priceSuggestion: {
    type: Type.OBJECT,
    description: "An object containing three distinct price suggestions based on market data of sold items.",
    properties: {
        quickSale: {
            type: Type.NUMBER,
            description: "A competitive price for a fast sale, typically below market value."
        },
        marketValue: {
            type: Type.NUMBER,
            description: "A fair market price, reflecting the item's condition and demand."
        },
        premium: {
            type: Type.NUMBER,
            description: "A premium price for buyers looking for quality, often for items in mint condition or with desirable attributes."
        }
    },
    required: ["quickSale", "marketValue", "premium"]
  },
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


export const generateListing = async (
  images: File[],
  notes: string,
  isEbayConfigured: boolean,
  isTwitterConfigured: boolean,
  geminiApiKey: string
): Promise<Omit<Listing, 'id' | 'createdAt' | 'selectedPrice'>[]> => {
  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured. Please add it in the settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  if (images.length === 0) {
    throw new Error("At least one image is required to generate a listing.");
  }
  
  // Dynamically construct schema and a more detailed prompt
  const finalSchemaProperties: any = { ...baseSchemaProperties };
  const finalRequired = ["title", "description", "priceSuggestion", "category"];
  
  let promptInstructions = `Act as an expert marketplace seller and copywriter. Your task is to generate 3 compelling and distinct variations of a product listing based on the provided images and user notes.

**Analysis Instructions:**
1.  **Analyze Market Data for Pricing:** This is the most critical step. Leverage your knowledge of pricing trends from *recently sold items* on marketplaces like eBay to generate three specific price points for each listing variation in the 'priceSuggestion' object.
    -   'quickSale': A competitive price to attract buyers looking for a deal.
    -   'marketValue': The most likely selling price based on comparable sold items.
    -   'premium': A price for a top-quality item, perhaps new or in mint condition with all accessories.
2.  **Determine Condition:** Carefully examine the images and user notes to determine the item's condition. Use standard e-commerce condition keywords in the description (e.g., "New," "Like New," "Used," "Good Condition," "For parts/not working").
3.  **Identify Details from Notes:** Pay close attention to the user's notes. Explicitly mention any included accessories (e.g., "comes with original box and charger") or noted defects (e.g., "slight scratch on the back corner") in the main description.

**User Provided Information:**
-   **Notes:** "${notes || "No additional notes provided."}"

**Output Format & Variation-Specific Instructions:**
-   Generate the response **only** in a JSON array format that adheres to the provided schema. Each object in the array is a listing variation.
-   **Variation 1 (Professional & High-Value):** A premium, detailed listing targeting buyers looking for quality. Use a professional tone. The price suggestions should reflect the high-end market value.
-   **Variation 2 (Casual & Quick-Sale):** A friendly, concise listing aiming for a fast sale. Use a casual, approachable tone. The price suggestions should be competitive for a quick turnaround.
-   **Variation 3 (Benefit-Focused & Urgent):** A persuasive listing that creates a sense of urgency (e.g., "Don't miss out!"). Highlight key benefits for the buyer. The price suggestions can be mid-range.
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
    return listingData as Omit<Listing, 'id' | 'createdAt' | 'selectedPrice'>[];
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Failed to generate listing. The model returned an invalid format.");
  }
};


export const verifyGeminiApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) {
    return false;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
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
