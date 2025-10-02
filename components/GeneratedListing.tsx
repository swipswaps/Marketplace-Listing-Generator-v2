
import React from 'react';
import type { Listing } from '../types';

interface GeneratedListingProps {
  listing: Listing;
}

export const GeneratedListing: React.FC<GeneratedListingProps> = ({ listing }) => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(listing.price);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">{listing.title}</h3>
        <p className="mt-2 text-sm text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">
          Category: <span className="font-semibold text-slate-700">{listing.category}</span>
        </p>
      </div>

      <div className="text-4xl font-extrabold text-indigo-600">
        {formattedPrice}
      </div>

      <div>
        <h4 className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Description</h4>
        <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
          {listing.description.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
};
