export interface Listing {
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
