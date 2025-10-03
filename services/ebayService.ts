import { Listing, ApiKeys, EbayCategorySuggestion, EbayCondition } from "../types";

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
 */
export const postToEbay = (listing: Listing, apiKeys: ApiKeys): void => {
    const baseUrl = SITE_URLS[apiKeys.ebayEnvironment];
    
    const categoryId = listing.ebay?.categoryId || '0'; 

    const url = new URL(`${baseUrl}/sl/prelist/suggest`);
    url.searchParams.set('title', listing.ebay?.title || listing.title);
    url.searchParams.set('catId', categoryId);

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
};

/**
 * Verifies eBay credentials by making a simple, live, read-only API call.
 */
export const verifyEbayCredentials = async (
    keys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment' | 'ebayAppId'>
): Promise<{ success: boolean; error?: string }> => {
    const { ebayUserToken, ebayEnvironment } = keys;

    if (!ebayUserToken) {
        return { success: false, error: "User Token is missing." };
    }

    // A simple call to get the default category tree ID is a reliable way to verify the token.
    try {
        const categoryTreeId = await getDefaultCategoryTreeId(keys);
        if (categoryTreeId) {
            return { success: true };
        } else {
             return { success: false, error: "Received an empty response from eBay." };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * Fetches the default category tree ID for a marketplace.
 * This is a helper function used for verification.
 */
const getDefaultCategoryTreeId = async (keys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment'>) => {
    const endpoint = API_ENDPOINTS[keys.ebayEnvironment];
    // EBAY_US marketplace ID is '0'
    const url = `${endpoint}/sell/taxonomy/v1/category_tree/0`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${keys.ebayUserToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || `HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data.categoryTreeId;
}


/**
 * Fetches eBay category suggestions based on a query string.
 * Uses the Taxonomy API's getCategorySuggestions method.
 */
export const getCategorySuggestions = async (
    query: string, 
    keys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment'>
): Promise<EbayCategorySuggestion[]> => {
    const categoryTreeId = await getDefaultCategoryTreeId(keys);
    const endpoint = API_ENDPOINTS[keys.ebayEnvironment];
    const url = `${endpoint}/sell/taxonomy/v1/category_tree/${categoryTreeId}/get_category_suggestions?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${keys.ebayUserToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to fetch category suggestions.');
    }
    
    const data = await response.json();
    return data.categorySuggestions || [];
};

/**
 * Fetches the applicable item conditions for a specific category.
 * Uses the Metadata API's getItemConditions method.
 */
export const getCategoryConditions = async (
    categoryId: string, 
    keys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment'>
): Promise<EbayCondition[]> => {
    const categoryTreeId = await getDefaultCategoryTreeId(keys);
    const endpoint = API_ENDPOINTS[keys.ebayEnvironment];
    const url = `${endpoint}/sell/metadata/v1/marketplace/EBAY_US/get_item_conditions?category_ids=${categoryId}&category_tree_id=${categoryTreeId}`;
    
     const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${keys.ebayUserToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to fetch item conditions.');
    }
    
    const data = await response.json();
    // The response is complex, we need to drill down to find the conditions array
    return data.itemConditionsForCategory?.[0]?.itemConditions || [];
}
