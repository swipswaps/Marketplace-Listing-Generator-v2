import React, { useState } from 'react';
import type { Listing } from '../types';
import { CloseIcon, EditIcon } from './icons';

interface EditListingModalProps {
  listing: Listing;
  onSave: (updatedListing: Listing) => void;
  onClose: () => void;
}

type Tab = 'general' | 'ebay' | 'twitter';

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}> = ({ label, isActive, onClick, disabled }) => (
  <button
    type="button"
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

export const EditListingModal: React.FC<EditListingModalProps> = ({ listing, onSave, onClose }) => {
  const [editedListing, setEditedListing] = useState<Listing>(listing);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedListing(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for user-friendliness, but treat as 0 for state
    const price = value === '' ? 0 : parseFloat(value);
    if (!isNaN(price)) {
        setEditedListing(prev => ({ ...prev, selectedPrice: price }));
    }
  };

  const handlePlatformInputChange = (platform: 'ebay' | 'twitter', field: string, value: string) => {
    setEditedListing(prev => ({
        ...prev,
        [platform]: {
            ...prev[platform],
            [field]: value,
        },
    }));
  };

  const handleSave = () => {
    onSave(editedListing);
  };
  
  const handleTabClick = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <EditIcon className="h-6 w-6 text-slate-700"/>
            <h2 className="text-xl font-semibold text-slate-800">Edit Listing</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <CloseIcon className="h-5 w-5 text-slate-500"/>
          </button>
        </header>

        <main className="p-8 flex-grow overflow-y-auto space-y-6">
            <div className="border-b border-slate-200 mb-6">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <TabButton label="General" isActive={activeTab === 'general'} onClick={(e) => handleTabClick(e, 'general')} />
                    <TabButton label="eBay" isActive={activeTab === 'ebay'} onClick={(e) => handleTabClick(e, 'ebay')} disabled={!listing.ebay} />
                    <TabButton label="Twitter" isActive={activeTab === 'twitter'} onClick={(e) => handleTabClick(e, 'twitter')} disabled={!listing.twitter} />
                </nav>
            </div>
            
            {activeTab === 'general' && (
                <div className="space-y-4 animate-fade-in">
                     <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
                        <input type="text" name="title" id="title" value={editedListing.title} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea name="description" id="description" rows={8} value={editedListing.description} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="selectedPrice" className="block text-sm font-medium text-slate-700">Price (USD)</label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-slate-500 sm:text-sm">$</span>
                                </div>
                                <input type="number" name="selectedPrice" id="selectedPrice" value={editedListing.selectedPrice} onChange={handlePriceChange} className="block w-full rounded-md border-slate-300 pl-7 pr-12" placeholder="0.00" />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
                            <input type="text" name="category" id="category" value={editedListing.category} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ebay' && editedListing.ebay && (
                 <div className="space-y-4 animate-fade-in">
                     <div>
                        <label htmlFor="ebay-title" className="block text-sm font-medium text-slate-700">eBay Title</label>
                        <input type="text" id="ebay-title" value={editedListing.ebay.title} onChange={(e) => handlePlatformInputChange('ebay', 'title', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                     <div>
                        <label htmlFor="ebay-desc" className="block text-sm font-medium text-slate-700">eBay HTML Description</label>
                        <textarea id="ebay-desc" rows={10} value={editedListing.ebay.descriptionHtml} onChange={(e) => handlePlatformInputChange('ebay', 'descriptionHtml', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                 </div>
            )}

             {activeTab === 'twitter' && editedListing.twitter && (
                 <div className="space-y-4 animate-fade-in">
                     <div>
                        <label htmlFor="twitter-tweet" className="block text-sm font-medium text-slate-700">X (Twitter) Post</label>
                        <textarea id="twitter-tweet" rows={5} value={editedListing.twitter.tweet} onChange={(e) => handlePlatformInputChange('twitter', 'tweet', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                 </div>
            )}
            
        </main>
        
        <footer className="flex items-center justify-end p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex-shrink-0">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};