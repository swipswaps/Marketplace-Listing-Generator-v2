import React, { useState, useCallback, useEffect } from 'react';
import { generateListing } from './services/geminiService';
import type { Listing } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { ImagePreview } from './components/ImagePreview';
import { GeneratedListing } from './components/GeneratedListing';
import { LoadingSpinner, UploadIcon, SettingsIcon } from './components/icons';

const MAX_IMAGES = 4;

export default function App() {
  const [productName, setProductName] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [generatedListing, setGeneratedListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // API Keys State
  const [apiKey, setApiKey] = useState<string>('');
  const [ebayToken, setEbayToken] = useState<string>('');
  const [twitterApiKey, setTwitterApiKey] = useState<string>('');
  const [twitterApiSecret, setTwitterApiSecret] = useState<string>('');
  const [twitterAccessToken, setTwitterAccessToken] = useState<string>('');
  const [twitterAccessTokenSecret, setTwitterAccessTokenSecret] = useState<string>('');

  // Temp state for modal inputs
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [tempEbayToken, setTempEbayToken] = useState<string>('');
  const [tempTwitterApiKey, setTempTwitterApiKey] = useState<string>('');
  const [tempTwitterApiSecret, setTempTwitterApiSecret] = useState<string>('');
  const [tempTwitterAccessToken, setTempTwitterAccessToken] = useState<string>('');
  const [tempTwitterAccessTokenSecret, setTempTwitterAccessTokenSecret] = useState<string>('');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key') || '';
    const storedEbayToken = localStorage.getItem('ebay_oauth_token') || '';
    const storedTwitterApiKey = localStorage.getItem('twitter_api_key') || '';
    const storedTwitterApiSecret = localStorage.getItem('twitter_api_secret') || '';
    const storedTwitterAccessToken = localStorage.getItem('twitter_access_token') || '';
    const storedTwitterAccessTokenSecret = localStorage.getItem('twitter_access_token_secret') || '';
    
    setApiKey(storedApiKey);
    setEbayToken(storedEbayToken);
    setTwitterApiKey(storedTwitterApiKey);
    setTwitterApiSecret(storedTwitterApiSecret);
    setTwitterAccessToken(storedTwitterAccessToken);
    setTwitterAccessTokenSecret(storedTwitterAccessTokenSecret);

    if (!storedApiKey) {
      setIsSettingsOpen(true); // Open settings on first load if no key
    }
  }, []);
  
  const handleSaveCredentials = () => {
    localStorage.setItem('gemini_api_key', tempApiKey);
    localStorage.setItem('ebay_oauth_token', tempEbayToken);
    localStorage.setItem('twitter_api_key', tempTwitterApiKey);
    localStorage.setItem('twitter_api_secret', tempTwitterApiSecret);
    localStorage.setItem('twitter_access_token', tempTwitterAccessToken);
    localStorage.setItem('twitter_access_token_secret', tempTwitterAccessTokenSecret);
    
    setApiKey(tempApiKey);
    setEbayToken(tempEbayToken);
    setTwitterApiKey(tempTwitterApiKey);
    setTwitterApiSecret(tempTwitterApiSecret);
    setTwitterAccessToken(tempTwitterAccessToken);
    setTwitterAccessTokenSecret(tempTwitterAccessTokenSecret);
    
    setIsSettingsOpen(false);
    setError(null); // Clear previous errors
  };

  const handleOpenSettings = () => {
    setTempApiKey(apiKey);
    setTempEbayToken(ebayToken);
    setTempTwitterApiKey(twitterApiKey);
    setTempTwitterApiSecret(twitterApiSecret);
    setTempTwitterAccessToken(twitterAccessToken);
    setTempTwitterAccessTokenSecret(twitterAccessTokenSecret);
    setIsSettingsOpen(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const combinedFiles = [...images, ...newFiles].slice(0, MAX_IMAGES);
      setImages(combinedFiles);
    }
  };

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productName || images.length === 0) {
      setError('Please provide a product name and at least one image.');
      return;
    }
    if (!apiKey) {
      setError('Please set your Gemini API key in the settings.');
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedListing(null);

    try {
      const imagePromises = images.map(async (file) => {
        const base64Data = await fileToBase64(file);
        return {
          mimeType: file.type,
          data: base64Data,
        };
      });

      const imagePayloads = await Promise.all(imagePromises);
      const isTwitterConfigured = !!(twitterApiKey && twitterApiSecret && twitterAccessToken && twitterAccessTokenSecret);
      const result = await generateListing(
        productName, 
        productDescription, 
        imagePayloads, 
        !!ebayToken, 
        isTwitterConfigured
      );
      setGeneratedListing(result);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred while generating the listing.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const isEbayConfigured = !!ebayToken;
  const isTwitterConfigured = !!(twitterApiKey && twitterApiSecret && twitterAccessToken && twitterAccessTokenSecret);

  return (
    <>
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold text-slate-800">API Credentials</h2>
            <p className="text-sm text-slate-500 mt-2">
              Credentials are stored in your browser's local storage and are not sent to our servers.
            </p>
            
            <div className="mt-6 space-y-6">
              {/* Gemini Settings */}
              <fieldset className="border-t pt-4">
                <legend className="text-lg font-semibold text-slate-800">Gemini</legend>
                <p className="text-sm text-slate-500 mb-3">Required for generating all content.</p>
                <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700">Gemini API Key</label>
                <input id="apiKey" type="password" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} placeholder="Enter your API key" className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
              </fieldset>

              {/* eBay Settings */}
              <fieldset className="border-t pt-4">
                <legend className="text-lg font-semibold text-slate-800">eBay (Optional)</legend>
                <p className="text-sm text-slate-500 mb-3">Required to generate eBay-specific content.</p>
                <label htmlFor="ebayToken" className="block text-sm font-medium text-slate-700">eBay OAuth Token</label>
                <input id="ebayToken" type="password" value={tempEbayToken} onChange={(e) => setTempEbayToken(e.target.value)} placeholder="Enter your eBay OAuth Token" className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
              </fieldset>
              
              {/* Twitter Settings */}
              <fieldset className="border-t pt-4">
                <legend className="text-lg font-semibold text-slate-800">X.com / Twitter (Optional)</legend>
                <p className="text-sm text-slate-500 mb-3">Required to generate Twitter-specific content.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="twitterApiKey" className="block text-sm font-medium text-slate-700">API Key</label>
                        <input id="twitterApiKey" type="password" value={tempTwitterApiKey} onChange={(e) => setTempTwitterApiKey(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="twitterApiSecret" className="block text-sm font-medium text-slate-700">API Key Secret</label>
                        <input id="twitterApiSecret" type="password" value={tempTwitterApiSecret} onChange={(e) => setTempTwitterApiSecret(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="twitterAccessToken" className="block text-sm font-medium text-slate-700">Access Token</label>
                        <input id="twitterAccessToken" type="password" value={tempTwitterAccessToken} onChange={(e) => setTempTwitterAccessToken(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="twitterAccessTokenSecret" className="block text-sm font-medium text-slate-700">Access Token Secret</label>
                        <input id="twitterAccessTokenSecret" type="password" value={tempTwitterAccessTokenSecret} onChange={(e) => setTempTwitterAccessTokenSecret(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                </div>
              </fieldset>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300">
                Cancel
              </button>
              <button onClick={handleSaveCredentials} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={!tempApiKey}>
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-slate-100/50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute top-0 right-0">
            <button onClick={handleOpenSettings} className="p-2 rounded-full bg-white/60 hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors shadow-sm backdrop-blur-sm" aria-label="Settings">
              <SettingsIcon className="h-6 w-6" />
            </button>
          </div>

          <header className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Marketplace Listing Generator</h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              Instantly create compelling marketplace listings with AI. Just add your product details and images to get started.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Input Form Section */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <h2 className="text-2xl font-semibold mb-6 text-slate-800">1. Enter Product Details</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="productName" className="block text-sm font-medium text-slate-700 mb-1">
                    Product Name
                  </label>
                  <input
                    id="productName"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Vintage Leather Backpack"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="productDescription" className="block text-sm font-medium text-slate-700 mb-1">
                    Product Description (Optional)
                  </label>
                  <textarea
                    id="productDescription"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe key features, condition, and dimensions..."
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Images (up to {MAX_IMAGES})
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <UploadIcon />
                      <div className="flex text-sm text-slate-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload files</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} disabled={images.length >= MAX_IMAGES} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  </div>
                </div>

                <ImagePreview images={images} onRemove={handleRemoveImage} />
                
                <button
                  type="submit"
                  disabled={isLoading || !productName || images.length === 0 || !apiKey}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      Generating...
                    </>
                  ) : (
                    'Generate Listing'
                  )}
                </button>
              </form>
            </div>

            {/* Output Section */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <h2 className="text-2xl font-semibold mb-6 text-slate-800">2. Generated Listing</h2>
              <div className="h-full min-h-[300px] flex flex-col">
                {isLoading && (
                    <div className="text-center space-y-4 flex-grow flex flex-col justify-center">
                      <LoadingSpinner className="mx-auto h-12 w-12 text-indigo-500"/>
                      <p className="text-slate-600 animate-pulse">AI is crafting the perfect listing...</p>
                    </div>
                )}
                {error && (
                  <div className="text-center p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    <p className="font-semibold">An Error Occurred</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                {generatedListing && !isLoading && (
                  <GeneratedListing 
                    listing={generatedListing}
                    isEbayConfigured={isEbayConfigured}
                    isTwitterConfigured={isTwitterConfigured}
                  />
                )}
                {!isLoading && !generatedListing && !error && (
                  <div className="text-center text-slate-500 flex-grow flex flex-col justify-center">
                    {apiKey ? (
                      <p>Your generated listing will appear here.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-semibold text-amber-600">API Key Required</p>
                        <p>Please add your Gemini API key in the settings to begin.</p>
                        <button onClick={handleOpenSettings} className="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                          Open Settings
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
