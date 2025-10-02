import { Listing } from "../types";

/**
 * Opens the eBay "Sell Your Item" page with the title pre-filled.
 * This provides a secure and robust way to hand off the listing creation
 * to eBay, ensuring all user policies are correctly applied.
 * @param listing The generated listing data.
 */
export const listOnEbay = (listing: Listing, authToken: string): void => {
  if (!listing.ebay?.title || !authToken) {
    console.error("eBay title or auth token is missing.");
    return;
  }
  
  const encodedTitle = encodeURIComponent(listing.ebay.title);
  const ebaySellUrl = `https://www.ebay.com/sl/prelist/suggest?title=${encodedTitle}`;
  
  window.open(ebaySellUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Verifies an eBay OAuth token by making a lightweight, real API call.
 * @param token The eBay OAuth token.
 * @returns A promise that resolves to true if the token is valid, false otherwise.
 */
export const verifyEbayToken = async (token: string): Promise<boolean> => {
    if (!token || !token.trim()) {
        return false;
    }
    
    // This is a lightweight endpoint that requires authentication, perfect for validation.
    const validationEndpoint = 'https://api.ebay.com/sell/account/v1/payment_policy';

    try {
        const response = await fetch(validationEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        
        // A successful response (e.g., 200 OK) means the token is valid.
        // A 401 Unauthorized or other error means it's invalid.
        return response.ok;

    } catch (error) {
        console.error("Error verifying eBay token:", error);
        return false;
    }
};
