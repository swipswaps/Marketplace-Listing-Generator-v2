import { Listing, ApiKeys, EbayCategorySuggestion, EbayCondition } from "../types";

const SITE_URLS = {
    production: 'https://www.ebay.com',
    sandbox: 'https://www.sandbox.ebay.com'
};

/**
 * Opens the eBay "Sell Your Item" page in a new tab with details pre-filled.
 * This constructs an intelligent URL to streamline the user's workflow.
 */
export const postToEbay = (listing: Listing, apiKeys: ApiKeys): void => {
    const baseUrl = SITE_URLS[apiKeys.ebayEnvironment];
    
    // Use the AI-suggested category as a search query on eBay's listing flow.
    // While we can't get an official ID due to CORS, this provides a helpful starting point.
    const url = new URL(`${baseUrl}/sl/prelist/suggest`);
    url.searchParams.set('title', listing.ebay?.title || listing.title);
    url.searchParams.set('description', listing.description);
    url.searchParams.set('acat', listing.category); // 'acat' is a parameter for auto-category

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
};

/**
 * Verifies eBay credentials via a client-side format check.
 * This is the most robust verification possible without a backend, as direct
 * API calls from the browser are blocked by eBay's CORS policy.
 */
export const verifyEbayCredentials = async (
    keys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment' | 'ebayAppId'>
): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const { ebayUserToken, ebayAppId } = keys;

    if (!ebayAppId || ebayAppId.trim().length < 5) {
        return { success: false, error: "App ID is missing or too short." };
    }
    if (!ebayUserToken || ebayUserToken.trim().length < 10) {
        return { success: false, error: "User Token is missing or too short." };
    }
    
    // If we passed the basic checks, we assume it's valid from a client-side perspective.
    // The user will discover if it's truly invalid when they are redirected to eBay.
    return { success: true };
};

// FIX: Added dummy implementations for getCategorySuggestions and getCategoryConditions to resolve compilation errors.
// These functions are placeholders because direct client-side API calls to eBay are blocked by CORS policy.
/**
 * Fetches category suggestions from eBay.
 * NOTE: This is a placeholder as direct API calls are blocked by CORS.
 * In a real app, this would be a call to a backend proxy.
 * @param query The search query for categories.
 * @param apiKeys The user's API keys.
 * @returns A promise that resolves to an array of category suggestions.
 */
export const getCategorySuggestions = async (
    query: string,
    apiKeys: ApiKeys
): Promise<EbayCategorySuggestion[]> => {
    console.warn("getCategorySuggestions is not implemented due to eBay CORS policy. Returning empty array.");
    return [];
};

/**
 * Fetches conditions for a given eBay category.
 * NOTE: This is a placeholder as direct API calls are blocked by CORS.
 * In a real app, this would be a call to a backend proxy.
 * @param categoryId The ID of the eBay category.
 * @param apiKeys The user's API keys.
 * @returns A promise that resolves to an array of item conditions.
 */
export const getCategoryConditions = async (
    categoryId: string,
    apiKeys: ApiKeys
): Promise<EbayCondition[]> => {
    console.warn("getCategoryConditions is not implemented due to eBay CORS policy. Returning empty array.");
    return [];
};
