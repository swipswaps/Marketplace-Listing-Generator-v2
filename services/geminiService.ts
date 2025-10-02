import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import { Listing } from "../types";

const listingSchema = {
  type: Type.OBJECT,
  properties: {
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
    ebay: {
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
    },
    twitter: {
        type: Type.OBJECT,
        description: "Content optimized for a post on X (formerly Twitter).",
        properties: {
            tweet: {
                type: Type.STRING,
                description: "A short, engaging tweet to promote the item. Include relevant hashtags. Maximum 280 characters.",
            },
        },
        required: ["tweet"],
    },
  },
  required: ["title", "description", "price", "category", "ebay", "twitter"],
};

export const generateListing = async (
  images: File[],
  notes: string,
  apiKey: string
): Promise<Listing> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not provided.");
  }

  const ai = new GoogleGenAI({ apiKey });

  if (images.length === 0) {
    throw new Error("At least one image is required to generate a listing.");
  }

  const base64Images = await Promise.all(images.map(fileToBase64));

  const imageParts = base64Images.map((img, index) => ({
    inlineData: {
      mimeType: images[index].type,
      data: img,
    },
  }));

  const textPart = {
    text: `Based on the following images and user notes, generate a detailed product listing.
    
User Notes: "${notes || "No additional notes."}"

Generate the response in JSON format according to the provided schema.
The description should be well-written and persuasive.
The price should be a reasonable market estimate.
The eBay title should be optimized with keywords. The eBay description should be in clean HTML.
The Twitter post should be concise and include hashtags.
`,
  };

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


export const verifyGeminiApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) {
    return false;
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
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
