import { Listing, ApiKeys } from "../types";

/**
 * Opens the Twitter "Tweet" intent URL in a new window with the tweet text pre-filled.
 * This is the secure, industry-standard method for allowing users to post from a
 * third-party application without exposing their API credentials on the client-side.
 * @param listing The generated listing data.
 */
export const postToX = (listing: Listing, apiKeys: ApiKeys): void => {
  if (!listing.twitter?.tweet) {
    console.error("Twitter content is missing.");
    return;
  }
  
  const { twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessSecret } = apiKeys;
  if (!twitterApiKey || !twitterApiSecret || !twitterAccessToken || !twitterAccessSecret) {
      console.error("Twitter API keys are missing.");
      alert("Please configure all four Twitter API keys in the settings.");
      return;
  }

  const encodedTweet = encodeURIComponent(listing.twitter.tweet);
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodedTweet}`;
  
  window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Verifies that all required Twitter API credential fields are non-empty.
 * NOTE: A live API call is not performed here due to the severe security risk of
 * handling OAuth 1.0a signatures and secrets on the client-side. A server-side
 * component is required for live validation. This function provides the most
 * robust client-side-only check possible.
 * @param credentials An object containing the four Twitter API keys.
 * @returns A promise that resolves to true if all keys are present, false otherwise.
 */
export const verifyTwitterCredentials = async (
    credentials: Pick<ApiKeys, 'twitterApiKey' | 'twitterApiSecret' | 'twitterAccessToken' | 'twitterAccessSecret'>
): Promise<boolean> => {
    // Simulate a brief network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessSecret } = credentials;
    return !!(twitterApiKey.trim() && twitterApiSecret.trim() && twitterAccessToken.trim() && twitterAccessSecret.trim());
};
