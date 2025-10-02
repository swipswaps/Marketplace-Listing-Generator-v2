export interface Listing {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  selectedPrice: number;
  priceSuggestion: {
    quickSale: number;
    marketValue: number;
    premium: number;
    justification: string;
    sources: {
      title: string;
      url: string;
    }[];
  };
  category: string;
  images: {
    data: string; // base64 encoded image
    type: string; // e.g., 'image/jpeg'
  }[];
  ebay?: {
    title: string;
    descriptionHtml: string;
  };
  twitter?: {
    tweet: string;
  };
}
