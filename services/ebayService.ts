import type { ApiKeys, Listing, EbayCategorySuggestion, EbayCondition } from '../types';

const getEbayApiUrl = (env: 'production' | 'sandbox'): string => {
    return env === 'production' 
        ? 'https://api.ebay.com'
        : 'https://api.sandbox.ebay.com';
};

const getMarketplaceId = (): string => {
    // This app is scoped to the US marketplace for simplicity.
    return 'EBAY_US'; 
}

const ebayFetch = async (url: string, token: string, method: string = 'GET', body?: any) => {
    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: response.statusText };
        }
        
        const errorMessage = errorData.errors?.[0]?.message || errorData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
    }
    
    // Some eBay responses are empty on success (e.g., 204 No Content)
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export const getCategorySuggestions = async (
  query: string,
  apiKeys: ApiKeys
): Promise<EbayCategorySuggestion[]> => {
    if (!apiKeys.ebayUserToken) throw new Error("eBay User Token is not configured.");
    const apiUrl = getEbayApiUrl(apiKeys.ebayEnvironment);
    // Hardcoding category_tree_id for US marketplace (0).
    const url = `${apiUrl}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${encodeURIComponent(query)}`;
    const data = await ebayFetch(url, apiKeys.ebayUserToken);
    return data.categorySuggestions || [];
};

export const getCategoryConditions = async (
  categoryId: string,
  apiKeys: ApiKeys
): Promise<EbayCondition[]> => {
    if (!apiKeys.ebayUserToken) throw new Error("eBay User Token is not configured.");
    const apiUrl = getEbayApiUrl(apiKeys.ebayEnvironment);
    const marketplaceId = getMarketplaceId();
    const url = `${apiUrl}/commerce/metadata/v1/marketplace/${marketplaceId}/get_item_condition_policies?filter=categoryIds:{${categoryId}}`;
    const data = await ebayFetch(url, apiKeys.ebayUserToken);
    return data.itemConditionPolicies?.[0]?.itemConditions || [];
};

export const postToListingFlow = async (listing: Listing, apiKeys: ApiKeys): Promise<void> => {
    if (!listing.ebay || !listing.ebay.categoryId || !listing.ebay.conditionId) {
        throw new Error("Missing eBay category or condition ID.");
    }
    
    const baseUrl = apiKeys.ebayEnvironment === 'production' 
        ? 'https://bulksell.ebay.com/ws/eBayISAPI.dll' 
        : 'https://bulksell.sandbox.ebay.com/ws/eBayISAPI.dll';

    // Using the more modern Bulk Edit and Sell Your Item (SYI) flow which accepts more parameters.
    const params = new URLSearchParams({
        'action': 'start',
        'itemTitle': listing.ebay.title,
        'catId': listing.ebay.categoryId,
        'itemCondition': listing.ebay.conditionId,
        'price': String(listing.selectedPrice),
        'format': 'FixedPrice', 
        'wphoto': 'true', // Redirects to the page with photo uploader.
        'description': listing.ebay.descriptionHtml,
    });

    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
};

export const verifyEbayCredentials = async (
    apiKeys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment'>
): Promise<boolean> => {
    if (!apiKeys.ebayUserToken) return false;
    try {
        const apiUrl = getEbayApiUrl(apiKeys.ebayEnvironment);
        // This is a lightweight endpoint to check for authentication.
        const url = `${apiUrl}/sell/account/v1/privilege`;
        await ebayFetch(url, apiKeys.ebayUserToken);
        return true;
    } catch (error) {
        console.error("eBay credential verification failed:", error);
        return false;
    }
};
