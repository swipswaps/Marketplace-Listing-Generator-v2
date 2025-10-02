import React, { useState, useMemo } from 'react';
import type { Listing } from '../types';
import { listOnEbay } from '../services/ebayService';
import { postToX } from '../services/twitterService';
import { DeleteIcon } from './icons';

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

interface ListingItemProps {
  listing: Listing;
  apiKeys: ApiKeys;
  isEbayConfigured: boolean;
  isTwitterConfigured: boolean;
  onDelete: (id: string) => void;
}

type Tab = 'general' | 'ebay' | 'twitter';

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
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

export const ListingItem: React.FC<ListingItemProps> = ({ listing, apiKeys, isEbayConfigured, isTwitterConfigured, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const formattedPrice = useMemo(() => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(listing.price), [listing.price]);

  const formattedDate = useMemo(() => new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(listing.createdAt)), [listing.createdAt]);
  
  const handleListOnEbay = () => {
    listOnEbay(listing, apiKeys.ebay);
  };

  const handlePostToX = () => {
    postToX(listing, apiKeys.twitter);
  };
  
  const handleTabClick = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation(); // Prevent card from collapsing when a tab is clicked
    setActiveTab(tab);
  };

  return (
    <div className="border border-slate-200 rounded-lg shadow-sm transition-all hover:shadow-md">
        <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-600 truncate">{listing.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                        <span>{formattedPrice}</span>
                        <span className="font-bold">&middot;</span>
                        <span>{listing.category}</span>
                        <span className="font-bold hidden sm:inline">&middot;</span>
                        <span className="hidden sm:inline">{formattedDate}</span>
                    </div>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this listing?')) {
                            onDelete(listing.id);
                        }
                    }}
                    className="ml-4 p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50"
                    aria-label="Delete listing"
                >
                    <DeleteIcon className="h-4 w-4" />
                </button>
            </div>
        </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-200">
            <div className="border-b border-slate-200 mb-4">
                <nav className="flex space-x-2" aria-label="Tabs">
                <TabButton label="General" isActive={activeTab === 'general'} onClick={(e) => handleTabClick(e, 'general')} />
                <TabButton label="eBay" isActive={activeTab === 'ebay'} onClick={(e) => handleTabClick(e, 'ebay')} disabled={!listing.ebay} />
                <TabButton label="Twitter" isActive={activeTab === 'twitter'} onClick={(e) => handleTabClick(e, 'twitter')} disabled={!listing.twitter} />
                </nav>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'general' && (
                <div className="space-y-4">
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
                <div className="space-y-4">
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
                    <div className="space-y-4">
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
      )}
    </div>
  );
};