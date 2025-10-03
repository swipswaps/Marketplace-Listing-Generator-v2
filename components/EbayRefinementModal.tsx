import React, { useState, useEffect, useCallback } from 'react';
import type { Listing, ApiKeys, EbayCategorySuggestion, EbayCondition } from '../types';
import { getCategorySuggestions, getCategoryConditions } from '../services/ebayService';
import { CloseIcon } from './icons';
import toast from 'react-hot-toast';

interface EbayRefinementModalProps {
  listing: Listing | null;
  onPost: (listing: Listing) => void;
  onClose: () => void;
  isPosting: boolean;
  apiKeys: ApiKeys;
}

export const EbayRefinementModal: React.FC<EbayRefinementModalProps> = ({ listing, onPost, onClose, isPosting, apiKeys }) => {
  const [categorySuggestions, setCategorySuggestions] = useState<EbayCategorySuggestion[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  const [conditions, setConditions] = useState<EbayCondition[]>([]);
  const [selectedConditionId, setSelectedConditionId] = useState<string>('');
  
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingConditions, setIsLoadingConditions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!listing || !apiKeys.ebayUserToken) return;
    setIsLoadingCategories(true);
    setError(null);
    try {
      const suggestions = await getCategorySuggestions(listing.category, apiKeys);
      setCategorySuggestions(suggestions);
      if (suggestions.length > 0) {
        setSelectedCategoryId(suggestions[0].category.categoryId);
      }
    } catch (e: any) {
      const errorMessage = `Failed to fetch eBay categories: ${e.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [listing, apiKeys]);

  const fetchConditions = useCallback(async () => {
    if (!selectedCategoryId || !apiKeys.ebayUserToken) return;
    setIsLoadingConditions(true);
    setConditions([]);
    setSelectedConditionId('');
    try {
      const fetchedConditions = await getCategoryConditions(selectedCategoryId, apiKeys);
      setConditions(fetchedConditions);
      if (fetchedConditions.length > 0) {
        // Try to find a sensible default like "New" or "Used", otherwise pick the first one.
        const preferredConditionIds = ['1000', '3000', '2500', '2000']; // New, Used, Seller Refurbished, Certified Refurbished
        const defaultCondition = fetchedConditions.find(c => preferredConditionIds.includes(c.conditionId)) || fetchedConditions[0];
        if (defaultCondition) {
            setSelectedConditionId(defaultCondition.conditionId);
        }
      }
    } catch (e: any) {
       toast.error(`Failed to fetch item conditions: ${e.message}`);
    } finally {
      setIsLoadingConditions(false);
    }
  }, [selectedCategoryId, apiKeys]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);


  if (!listing) {
    return null;
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refinedListing: Listing = {
        ...listing,
        ebay: {
            ...listing.ebay!,
            categoryId: selectedCategoryId,
            conditionId: selectedConditionId,
        }
    };
    onPost(refinedListing);
  };
  
  const formatCategoryPath = (suggestion: EbayCategorySuggestion) => {
      const ancestorNames = (suggestion.categoryTreeNodeAncestors || []).map(a => a.categoryName);
      const allParts = [...ancestorNames, suggestion.category.categoryName];
      return allParts.join(' > ');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <header className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Refine for eBay ({apiKeys.ebayEnvironment})</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close">
                <CloseIcon className="h-6 w-6 text-slate-500" />
              </button>
            </header>
            
            <main className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Please confirm the official eBay category and condition for your item to ensure your listing is accurate.</p>
              
               <div className="bg-slate-50 p-3 rounded-md">
                <p className="text-sm font-semibold text-slate-800 truncate" title={listing.ebay?.title || listing.title}>{listing.ebay?.title || listing.title}</p>
              </div>

               <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700">eBay Category</label>
                <select 
                    id="category" 
                    value={selectedCategoryId} 
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    disabled={isLoadingCategories || categorySuggestions.length === 0}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                >
                  {isLoadingCategories && <option>Loading categories...</option>}
                  {!isLoadingCategories && categorySuggestions.length === 0 && <option>No suggestions found for "{listing.category}".</option>}
                  {categorySuggestions.map(sug => (
                      <option key={sug.category.categoryId} value={sug.category.categoryId}>
                          {formatCategoryPath(sug)}
                      </option>
                  ))}
                </select>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-slate-700">Item Condition</label>
                <select 
                    id="condition" 
                    value={selectedConditionId} 
                    onChange={e => setSelectedConditionId(e.target.value)}
                    disabled={!selectedCategoryId || isLoadingConditions || conditions.length === 0}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                >
                  {!selectedCategoryId && <option>Select a category first</option>}
                  {isLoadingConditions && <option>Loading conditions...</option>}
                  {!isLoadingConditions && conditions.length === 0 && selectedCategoryId && <option>No conditions found for this category</option>}
                  {conditions.map(cond => (
                      <option key={cond.conditionId} value={cond.conditionId}>
                          {cond.conditionName}
                      </option>
                  ))}
                </select>
              </div>

            </main>
            
            <footer className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                <button type="button" onClick={onClose} disabled={isPosting} className="mr-3 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button 
                    type="submit" 
                    disabled={isPosting || !selectedCategoryId || !selectedConditionId} 
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    {isPosting ? 'Redirecting...' : 'Continue to eBay'}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};