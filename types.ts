export interface Listing {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  priceSuggestion: {
    quickSale: number;
    marketValue: number;
    premium: number;
    justification: string;
  };
  selectedPrice: number;
  category: string;
  ebay?: {
    title: string;
    descriptionHtml: string;
  };
  twitter?: {
    tweet: string;
  };
}
