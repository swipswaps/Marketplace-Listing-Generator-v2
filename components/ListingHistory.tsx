import React, { useState, useMemo } from 'react';
import type { Listing } from '../types';
import { GeneratedListing } from './GeneratedListing';
import { SearchIcon, DownloadIcon } from './icons';
import { exportAsCsv, exportAsPdf, exportAsSql } from '../utils/exportUtils';

interface ListingHistoryProps {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onPostEbay: (listing: Listing) => void;
  onPostTwitter: (listing: Listing) => void;
  isEbayConfigured: boolean;
  isTwitterConfigured: boolean;
}

export const ListingHistory: React.FC<ListingHistoryProps> = ({ listings, onEdit, onDelete, onPostEbay, onPostTwitter, isEbayConfigured, isTwitterConfigured }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const filteredListings = useMemo(() => {
    if (!searchTerm) {
      return listings;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return listings.filter(
      (listing) =>
        listing.title.toLowerCase().includes(lowercasedTerm) ||
        listing.description.toLowerCase().includes(lowercasedTerm) ||
        listing.category.toLowerCase().includes(lowercasedTerm)
    );
  }, [listings, searchTerm]);
  
  const handleExport = (format: 'csv' | 'xls' | 'pdf' | 'sql') => {
    setIsExportMenuOpen(false);
    if (filteredListings.length === 0) {
        alert("There are no listings to export.");
        return;
    }
    switch (format) {
        case 'csv':
            exportAsCsv(filteredListings);
            break;
        case 'xls':
            exportAsCsv(filteredListings, true);
            break;
        case 'pdf':
            exportAsPdf(filteredListings);
            break;
        case 'sql':
            exportAsSql(filteredListings);
            break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Listing History</h2>
        
        <div className="flex items-center gap-4">
            <div className="relative flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full block rounded-md border-slate-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
                <button 
                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"
                >
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Export
                </button>
                {isExportMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleExport('csv') }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export as CSV</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleExport('xls') }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export as XLS</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleExport('pdf') }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export as PDF</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleExport('sql') }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">Export as SQL</a>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <GeneratedListing 
                key={listing.id} 
                listing={listing} 
                onEdit={onEdit} 
                onDelete={onDelete}
                onPostEbay={onPostEbay}
                onPostTwitter={onPostTwitter}
                isEbayConfigured={isEbayConfigured}
                isTwitterConfigured={isTwitterConfigured}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-500">
            {listings.length > 0 ? "No listings match your search." : "Your generated listings will appear here."}
          </p>
        </div>
      )}
    </div>
  );
};
