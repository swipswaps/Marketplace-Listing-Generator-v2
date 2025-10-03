import { Listing, ApiKeys } from "../types";

const API_ENDPOINTS = {
    production: 'https://api.ebay.com',
    sandbox: 'https://api.sandbox.ebay.com'
};

const SITE_URLS = {
    production: 'https://www.ebay.com',
    sandbox: 'https://www.sandbox.ebay.com'
};

/**
 * Opens the eBay "Sell Your Item" page in a new tab with details pre-filled.
 * This provides a seamless user experience while avoiding the immense complexity
 * and security risks of making server-side AddItem calls from a client-side app.
 * The URL is adjusted based on the selected environment.
 */
export const postToEbay = (listing: Listing, apiKeys: ApiKeys): void => {
    const baseUrl = SITE_URLS[apiKeys.ebayEnvironment];
    
    // The category ID would ideally be fetched from the Taxonomy API and stored on the listing.
    // We'll use a placeholder for now.
    const categoryId = '1'; 

    const url = new URL(`${baseUrl}/sl/prelist/suggest`);
    url.searchParams.set('title', listing.ebay?.title || listing.title);
    url.searchParams.set('catId', categoryId);
    // You can also pre-fill description, price, etc., but title and category are most effective.

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
};

/**
 * Verifies eBay credentials by making a simple, live, read-only API call.
 * This function calls the Taxonomy API's getCategoryTreeId endpoint, which
 * requires a valid OAuth token, providing definitive verification.
 * @returns A promise that resolves with a success or error status.
 */
export const verifyEbayCredentials = async (
    keys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment'>
): Promise<{ success: boolean; error?: string }> => {
    const { ebayUserToken, ebayEnvironment } = keys;

    if (!ebayUserToken) {
        return { success: false, error: "User Token is missing." };
    }

    const endpoint = API_ENDPOINTS[ebayEnvironment];
    const url = `${endpoint}/sell/taxonomy/v1/category_tree`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ebayUserToken}`,
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            return { success: true };
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.errors?.[0]?.message || `HTTP Error: ${response.status}`;
            return { success: false, error: errorMessage };
        }
    } catch (error: any) {
        console.error("eBay verification fetch error:", error);
        return { success: false, error: "A network error occurred. Check the browser console for details." };
    }
};
