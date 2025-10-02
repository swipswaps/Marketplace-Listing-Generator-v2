import { GoogleGenAI, Type } from "@google/genai";
import type { Listing } from "../types";

const listingSchema = {
  type: Type.OBJECT,
  properties: {
    title: { 
      type: Type.STRING,
      description: "A catchy and descriptive title for the product."
    },
    description: { 
      type: Type.STRING,
      description: "A detailed and compelling product description, formatted with paragraphs for general use."
    },
    price: { 
      type: Type.NUMBER,
      description: "A suggested price for the product in a common currency, without the currency symbol."
    },
    category: { 
      type: Type.STRING,
      description: "A relevant category for the product, e.g., 'Electronics > Mobile', 'Fashion > Shoes', 'Home Goods > Kitchenware'."
    },
    ebay: {
      type: Type.OBJECT,
      description: "eBay-specific listing details. Only include if requested.",
      properties: {
        title: {
          type: Type.STRING,
          description: "An eBay-optimized title, using keywords and respecting the 80-character limit."
        },
        descriptionHtml: {
          type: Type.STRING,
          description: "A detailed product description formatted in simple HTML for the eBay listing body. Use <p>, <ul>, <li>, and <b> tags to improve readability."
        }
      },
    },
    twitter: {
      type: Type.OBJECT,
      description: "Twitter-specific content. Only include if requested.",
      properties: {
        tweet: {
          type: Type.STRING,
          description: "A short, engaging tweet to promote the product, under 280 characters, with relevant hashtags."
        }
      },
    }
  },
  required: ["title", "description", "price", "category"],
};

interface ImagePayload {
  mimeType: string;
  data: string;
}

export const generateListing = async (
  productName: string,
  productDescription: string,
  images: ImagePayload[],
  includeEbay: boolean,
  includeTwitter: boolean
): Promise<Listing> => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("API key not found. Please set it in the settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const platformInstructions = `
    ${includeEbay ? '- Generate an eBay-specific title (max 80 characters) and an HTML-formatted description.' : ''}
    ${includeTwitter ? '- Generate a short, engaging tweet (max 280 characters) with relevant hashtags.' : ''}
  `;

  const prompt = `
    Given the following product information and images, generate a compelling marketplace listing.
    Product Name: ${productName}
    ${productDescription ? `Product Description: ${productDescription}` : ''}
    
    The listing must include a catchy general title, a detailed general description, a suggested price, and a relevant category.
    Analyze the images to identify key features, materials, and the condition of the item.
    Ensure the description is well-structured and persuasive for a potential buyer.

    Additionally, if requested, generate content for the following platforms:
    ${platformInstructions}
    
    Provide the output in the specified JSON format. If a platform (eBay, Twitter) was not requested, omit its corresponding key from the JSON object.
  `;

  const imageParts = images.map(image => ({
    inlineData: {
      mimeType: image.mimeType,
      data: image.data,
    },
  }));

  const textPart = {
    text: prompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: listingSchema,
      },
    });

    const jsonString = response.text;
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as Listing;

  } catch (error) {
    console.error("Error generating content:", error);
    if (error instanceof Error && error.message.includes("API key not found")) {
        throw error;
    }
    throw new Error("Failed to communicate with the Gemini API. Please check your API key and network connection.");
  }
};
