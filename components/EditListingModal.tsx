import React, { useState, useEffect } from 'react';
import type { Listing } from '../types';
import { CloseIcon } from './icons';

interface EditListingModalProps {
  listing: Listing | null;
  onSave: (updatedListing: Listing) => void;
  onClose: () => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({ listing, onSave, onClose }) => {
  const [formData, setFormData] = useState<Listing | null>(listing);

  useEffect(() => {
    setFormData(listing);
  }, [listing]);

  if (!formData) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: name === 'selectedPrice' ? parseFloat(value) : value } : null);
  };
  
  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, platform: 'ebay' | 'twitter', field: string) => {
    const { value } = e.target;
    setFormData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [platform]: {
                ...prev[platform],
                [field]: value
            }
        }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Edit Listing</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close">
                <CloseIcon className="h-6 w-6 text-slate-500" />
              </button>
            </header>
            
            <main className="p-6 overflow-y-auto space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="selectedPrice" className="block text-sm font-medium text-slate-700">Price</label>
                  <input type="number" name="selectedPrice" id="selectedPrice" value={formData.selectedPrice} onChange={handleChange} step="0.01" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                 <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
                  <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>

              {formData.ebay && (
                 <fieldset className="border border-slate-200 p-4 rounded-md">
                    <legend className="text-sm font-semibold text-slate-600 px-2">eBay Content</legend>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="ebay-title" className="block text-sm font-medium text-slate-700">eBay Title</label>
                            <input type="text" id="ebay-title" value={formData.ebay.title} onChange={(e) => handleNestedChange(e, 'ebay', 'title')} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="ebay-description" className="block text-sm font-medium text-slate-700">eBay Description (HTML)</label>
                            <textarea id="ebay-description" value={formData.ebay.descriptionHtml} onChange={(e) => handleNestedChange(e, 'ebay', 'descriptionHtml')} rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                        </div>
                    </div>
                </fieldset>
              )}
              
              {formData.twitter && (
                 <fieldset className="border border-slate-200 p-4 rounded-md">
                    <legend className="text-sm font-semibold text-slate-600 px-2">X (Twitter) Content</legend>
                    <div>
                        <label htmlFor="twitter-tweet" className="block text-sm font-medium text-slate-700">Tweet Text</label>
                        <textarea id="twitter-tweet" value={formData.twitter.tweet} onChange={(e) => handleNestedChange(e, 'twitter', 'tweet')} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                    </div>
                 </fieldset>
              )}

            </main>
            
            <footer className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg flex-shrink-0">
                <button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">Save Changes</button>
            </footer>
        </form>
      </div>
    </div>
  );
};
