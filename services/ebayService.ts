import { Listing } from "../types";
import { toast } from 'react-hot-toast';

// A mock interface for what eBay credentials might look like.
// In a real app, this would be an OAuth token.
export interface EbayCredentials {
    appId: string;
    certId: string;
    devId: string;
    authToken: string;
}

/**
 * Copies the listing's HTML description to the clipboard and opens the eBay selling page.
 * This is a client-side friendly approach as direct API posting is complex and insecure.
 * @param listing The generated listing data.
 */
export const postToEbay = async (listing: Listing): Promise<void> => {
  if (!listing.ebay?.descriptionHtml || !listing.ebay?.title) {
    console.error("eBay title or HTML description is missing.");
    toast.error("eBay content is missing. Cannot proceed.");
    return;
  }

  try {
    await navigator.clipboard.writeText(listing.ebay.descriptionHtml);
    toast.success("eBay HTML description copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy HTML to clipboard:", err);
    toast.error("Could not copy HTML. Please copy it manually from the edit screen.");
  }

  // Deep-link to eBay's selling page. Title can be pre-filled.
  const encodedTitle = encodeURIComponent(listing.ebay.title);
  const ebaySellUrl = `https://www.ebay.com/sl/prelist/suggest?title=${encodedTitle}`;
  
  window.open(ebaySellUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Verifies that all required eBay API credential fields are non-empty.
 * NOTE: This is a superficial check. A real-world application would require a server-side
 * component to perform a live API call to validate OAuth tokens.
 * @param credentials An object containing mock eBay credentials.
 * @returns A promise that resolves to true if all keys are present, false otherwise.
 */
export const verifyEbayCredentials = async (credentials: EbayCredentials): Promise<boolean> => {
    // Simulate a brief network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { appId, certId, devId, authToken } = credentials;
    return !!(appId?.trim() && certId?.trim() && devId?.trim() && authToken?.trim());
};
