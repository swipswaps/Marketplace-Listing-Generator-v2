import React, { useState, useMemo } from 'react';
import type { Listing } from '../types';
import { listOnEbay } from '../services/ebayService';
import { postToX } from '../services/twitterService';

// Define ApiKeys interface locally to avoid prop drilling issues if it becomes complex
interface ApiKeys {
  gemini: string;
  ebay: string;
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
}

interface GeneratedListingProps {
  listing: Listing;
  apiKeys: ApiKeys;
  isEbayConfigured: boolean;
  isTwitterConfigured: boolean;
}

type Tab = 'general' | 'ebay' | 'twitter';

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {label}
  </button>
);

export const GeneratedListing: React.FC<GeneratedListingProps> = ({ listing, apiKeys, isEbayConfigured, isTwitterConfigured }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const formattedPrice = useMemo(() => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(listing.price), [listing.price]);
  
  const handleListOnEbay = () => {
    listOnEbay(listing, apiKeys.ebay);
  };

  const handlePostToX = () => {
    postToX(listing, apiKeys.twitter);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="border-b border-slate-200 mb-4">
        <nav className="flex space-x-2" aria-label="Tabs">
          <TabButton label="General" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
          <TabButton label="eBay" isActive={activeTab === 'ebay'} onClick={() => setActiveTab('ebay')} disabled={!listing.ebay} />
          <TabButton label="Twitter" isActive={activeTab === 'twitter'} onClick={() => setActiveTab('twitter')} disabled={!listing.twitter} />
        </nav>
      </div>

      <div className="flex-grow">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{listing.title}</h3>
              <p className="mt-2 text-sm text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">
                Category: <span className="font-semibold text-slate-700">{listing.category}</span>
              </p>
            </div>
            <div className="text-4xl font-extrabold text-indigo-600">{formattedPrice}</div>
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Description</h4>
              <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
                {listing.description.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ebay' && listing.ebay && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{listing.ebay.title}</h3>
              <p className="mt-2 text-sm text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">
                eBay Optimized Title
              </p>
            </div>
            <div className="text-4xl font-extrabold text-indigo-600">{formattedPrice}</div>
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">HTML Description</h4>
              <div
                className="prose prose-slate max-w-none text-slate-600 p-4 border rounded-lg bg-slate-50"
                dangerouslySetInnerHTML={{ __html: listing.ebay.descriptionHtml }}
              />
            </div>
            <button 
              onClick={handleListOnEbay}
              disabled={!isEbayConfigured}
              className="w-full mt-4 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              List on eBay
            </button>
            {!isEbayConfigured && <p className="text-xs text-center text-slate-500 mt-1">eBay token missing in settings.</p>}
          </div>
        )}
        
        {activeTab === 'twitter' && listing.twitter && (
            <div className="space-y-6">
                 <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">X.com (Twitter) Post</h4>
                    <div className="p-4 border rounded-lg bg-slate-50 text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {listing.twitter.tweet}
                    </div>
                </div>
                <button 
                  onClick={handlePostToX}
                  disabled={!isTwitterConfigured}
                  className="w-full mt-4 py-2 px-4 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  Post to X
                </button>
                {!isTwitterConfigured && <p className="text-xs text-center text-slate-500 mt-1">Twitter API keys missing in settings.</p>}
            </div>
        )}
      </div>
    </div>
  );
};
