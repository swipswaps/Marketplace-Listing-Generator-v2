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
  price: {
    type: Type.NUMBER,
    description: "A suggested market price for the item, as a number without currency symbols.",
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
): Promise<Listing> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured in environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (images.length === 0) {
    throw new Error("At least one image is required to generate a listing.");
  }
  
  // Dynamically construct schema and a more detailed prompt
  const finalSchemaProperties: any = { ...baseSchemaProperties };
  const finalRequired = ["title", "description", "price", "category"];
  
  let promptInstructions = `Act as an expert marketplace seller. Your task is to generate a compelling and accurate product listing based on the provided images and user notes.

**Analysis Instructions:**
1.  **Analyze Market Data:** Leverage your knowledge of pricing trends from recently sold items on marketplaces like eBay and the original manufacturer's specifications to inform your output. The price should be a competitive market estimate.
2.  **Determine Condition:** Carefully examine the images and user notes to determine the item's condition. Use standard e-commerce condition keywords in the description (e.g., "New," "Like New," "Used," "Good Condition," "For parts/not working").
3.  **Identify Details from Notes:** Pay close attention to the user's notes. Explicitly mention any included accessories (e.g., "comes with original box and charger") or noted defects (e.g., "slight scratch on the back corner") in the main description.

**User Provided Information:**
-   **Notes:** "${notes || "No additional notes provided."}"

**Output Format & Platform-Specific Instructions:**
-   Generate the response **only** in JSON format that adheres to the provided schema.
-   The main description should be detailed, persuasive, and structured with paragraphs.
`;

  const platformInstructions: string[] = [];
  if (isEbayConfigured) {
    finalSchemaProperties.ebay = ebaySchemaProperty;
    finalRequired.push("ebay");
    platformInstructions.push("- For the 'ebay' object, create a keyword-optimized title and a well-structured HTML description.");
  }
  
  if (isTwitterConfigured) {
    finalSchemaProperties.twitter = twitterSchemaProperty;
    finalRequired.push("twitter");
    platformInstructions.push("- For the 'twitter' object, create a concise, engaging tweet with relevant hashtags.");
  }

  if (platformInstructions.length > 0) {
    promptInstructions += `\n${platformInstructions.join('\n')}`;
  }
  
  const listingSchema = {
    type: Type.OBJECT,
    properties: finalSchemaProperties,
    required: finalRequired,
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
    return listingData as Listing;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Failed to generate listing. The model returned an invalid format.");
  }
};


export const verifyGeminiApiKey = async (): Promise<boolean> => {
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