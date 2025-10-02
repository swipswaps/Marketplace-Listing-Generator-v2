import React, { useState } from 'react';
import type { Listing } from '../types';
import { GeneratedListing } from './GeneratedListing';
import { SearchIcon, FilterIcon, DownloadIcon, DeleteIcon } from './icons';
import { exportAsPdf, exportAsCsv, exportAsSql } from '../utils/exportUtils';

interface ApiKeys {
    ebay: string;
    twitter: {
      apiKey: string;
      apiSecret: string;
      accessToken: string;
      accessSecret: string;
    };
}

interface ListingHistoryProps {
  listings: Listing[];
  apiKeys: ApiKeys;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  availableCategories: string[];
  onDelete: (id: string) => void;
  onClear: () => void;
  isEbayConfigured: boolean;
  isTwitterConfigured: boolean;
}

const ExportDropdown: React.FC<{ listings: Listing[] }> = ({ listings }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = (e: React.MouseEvent, format: 'pdf' | 'csv' | 'xls' | 'sql') => {
        e.preventDefault();
        if (listings.length === 0) {
            alert("There are no listings to export.");
            return;
        }
        switch (format) {
            case 'pdf': exportAsPdf(listings); break;
            case 'csv': exportAsCsv(listings); break;
            case 'xls': exportAsCsv(listings, true); break;
            case 'sql': exportAsSql(listings); break;
        }
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center justify-center w-full rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
                    id="menu-button"
                    aria-expanded="true"
                    aria-haspopup="true"
                >
                    <DownloadIcon className="h-5 w-5 mr-2 text-slate-500"/>
                    Export
                </button>
            </div>
            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        <a href="#" onClick={(e) => handleExport(e, 'pdf')} className="text-slate-700 block px-4 py-2 text-sm hover:bg-slate-100" role="menuitem">Save as PDF</a>
                        <a href="#" onClick={(e) => handleExport(e, 'csv')} className="text-slate-700 block px-4 py-2 text-sm hover:bg-slate-100" role="menuitem">Save as CSV</a>
                        <a href="#" onClick={(e) => handleExport(e, 'xls')} className="text-slate-700 block px-4 py-2 text-sm hover:bg-slate-100" role="menuitem">Save as XLS</a>
                        <a href="#" onClick={(e) => handleExport(e, 'sql')} className="text-slate-700 block px-4 py-2 text-sm hover:bg-slate-100" role="menuitem">Save as SQL</a>
                    </div>
                </div>
            )}
        </div>
    );
};


export const ListingHistory: React.FC<ListingHistoryProps> = (props) => {
    const { listings, apiKeys, searchTerm, setSearchTerm, sortOrder, setSortOrder, filterCategory, setFilterCategory, availableCategories, onDelete, onClear, isEbayConfigured, isTwitterConfigured } = props;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">2. Listing History</h2>
                    <p className="text-sm text-slate-500">Manage and export your generated listings.</p>
                </div>
                {listings.length > 0 && (
                     <div className="flex items-center space-x-2 flex-shrink-0">
                        <ExportDropdown listings={listings} />
                        <button
                            onClick={onClear}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 focus:outline-none"
                            aria-label="Clear all listings"
                        >
                            <DeleteIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
            
            {/* Controls */}
            <div className="space-y-4 mb-4">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-slate-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="sort-order" className="block text-sm font-medium text-slate-700">Sort by</label>
                        <select
                            id="sort-order"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        >
                            <option value="date-desc">Date: Newest</option>
                            <option value="date-asc">Date: Oldest</option>
                            <option value="price-desc">Price: High-Low</option>
                            <option value="price-asc">Price: Low-High</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="filter-category" className="block text-sm font-medium text-slate-700">Category</label>
                        <select
                            id="filter-category"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        >
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-2">
                 {listings.length > 0 ? (
                    listings.map(listing => (
                        <GeneratedListing
                            key={listing.id}
                            listing={listing}
                            apiKeys={apiKeys}
                            isEbayConfigured={isEbayConfigured}
                            isTwitterConfigured={isTwitterConfigured}
                            onDelete={onDelete}
                        />
                    ))
                ) : (
                    <div className="text-center text-slate-400 py-16">
                        <p>Your generated listings will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};