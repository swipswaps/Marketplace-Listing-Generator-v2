export interface ListingSource {
  title: string;
  url: string;
}

export interface PriceSuggestion {
  quickSale: number;
  marketValue: number;

  premium: number;
  justification: string;
  sources: ListingSource[];
}

export interface EbayData {
  title: string;
  descriptionHtml: string;
  categoryId?: string;
  conditionId?: string;
}

export interface TwitterData {
  tweet: string;
}

export interface Listing {
  id: string;
  createdAt: string;
  images: string[]; // array of keys for IndexedDB
  title: string;
  description: string;
  category: string;
  selectedPrice: number;
  priceSuggestion: PriceSuggestion;
  ebay?: EbayData;
  twitter?: TwitterData;
}

// For the variation modal, we don't have id, createdAt, or image keys yet.
export type ListingVariation = Omit<Listing, 'id' | 'createdAt' | 'images' | 'selectedPrice'>;

export interface ApiKeys {
  geminiApiKey: string;
  ebayAppId: string;
  ebayUserToken: string;
  ebayEnvironment: 'production' | 'sandbox';
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
}

// --- Specific types for eBay API responses ---

export interface EbayCategorySuggestion {
  category: {
    categoryId: string;
    categoryName: string;
  };
  categoryTreeNodeAncestors: {
    categoryName: string;
  }[];
}

export interface EbayCondition {
    conditionId: string;
    conditionName: string;
}
