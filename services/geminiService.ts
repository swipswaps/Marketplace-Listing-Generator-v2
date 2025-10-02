
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
      description: "A detailed and compelling product description, formatted with paragraphs."
    },
    price: { 
      type: Type.NUMBER,
      description: "A suggested price for the product in a common currency, without the currency symbol."
    },
    category: { 
      type: Type.STRING,
      description: "A relevant category for the product, e.g., 'Electronics > Mobile', 'Fashion > Shoes', 'Home Goods > Kitchenware'."
    },
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
  images: ImagePayload[]
): Promise<Listing> => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("API key not found. Please set it in the settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Given the following product information and images, generate a compelling marketplace listing.
    Product Name: ${productName}
    ${productDescription ? `Product Description: ${productDescription}` : ''}
    
    The listing should include a catchy title, a detailed description, a suggested price, and a relevant category.
    Analyze the images to identify key features, materials, and the condition of the item.
    Ensure the description is well-structured and persuasive for a potential buyer.
    Provide the output in the specified JSON format.
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
