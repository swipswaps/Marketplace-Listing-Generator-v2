export interface Listing {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  price: number;
  category: string;
  ebay?: {
    title: string;
    descriptionHtml: string;
  };
  twitter?: {
    tweet: string;
  };
}