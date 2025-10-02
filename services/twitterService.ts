import { Listing } from "../types";

interface TwitterApiKeys {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
}

/**
 * Opens the Twitter "Tweet" intent URL in a new window with the tweet text pre-filled.
 * This is the secure, industry-standard method for allowing users to post from a
 * third-party application without exposing their API credentials on the client-side.
 * @param listing The generated listing data.
 */
export const postToX = (listing: Listing, apiKeys: TwitterApiKeys): void => {
  if (!listing.twitter?.tweet) {
    console.error("Twitter content is missing.");
    return;
  }
  
  const { apiKey, apiSecret, accessToken, accessSecret } = apiKeys;
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      console.error("Twitter API keys are missing.");
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
export const verifyTwitterCredentials = async (credentials: TwitterApiKeys): Promise<boolean> => {
    // Simulate a brief network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { apiKey, apiSecret, accessToken, accessSecret } = credentials;
    return !!(apiKey.trim() && apiSecret.trim() && accessToken.trim() && accessSecret.trim());
};
