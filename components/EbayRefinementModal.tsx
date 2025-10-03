import React, { useState } from 'react';
import type { Listing, ApiKeys } from '../types';
import { CloseIcon } from './icons';

interface EbayRefinementModalProps {
  listing: Listing | null;
  onPost: (listing: Listing, refinementData: any) => void;
  onClose: () => void;
  isPosting: boolean;
  apiKeys: ApiKeys;
}

export const EbayRefinementModal: React.FC<EbayRefinementModalProps> = ({ listing, onPost, onClose, isPosting, apiKeys }) => {
  const [category, setCategory] = useState('181313'); // Mock eBay category ID
  const [condition, setCondition] = useState('3000'); // Used
  const [duration, setDuration] = useState('Days_7');

  if (!listing) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refinementData = { category, condition, duration };
    onPost(listing, refinementData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <header className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Post to eBay ({apiKeys.ebayEnvironment})</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close">
                <CloseIcon className="h-6 w-6 text-slate-500" />
              </button>
            </header>
            
            <main className="p-6 space-y-4">
              <p className="text-sm text-slate-600">This action will open a new tab on eBay's website with the listing title and category pre-filled to streamline the listing process.</p>
              
              <div className="bg-slate-100 p-3 rounded-md">
                <p className="text-sm font-medium text-slate-800">{listing.ebay?.title || listing.title}</p>
                <p className="text-sm text-slate-500">Price: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(listing.selectedPrice)}</p>
              </div>

               <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700">eBay Category</label>
                <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="181313">Collectibles & Art > Pinbacks</option>
                  <option value="1249">Business & Industrial > Heavy Equipment</option>
                  <option value="11116">Home & Garden > Tools & Workshop Equipment</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">This is a simplified demo. Future versions will fetch categories dynamically.</p>
              </div>

            </main>
            
            <footer className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                <button type="button" onClick={onClose} disabled={isPosting} className="mr-3 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isPosting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-wait">
                    {isPosting ? 'Redirecting...' : 'Continue to eBay'}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};
