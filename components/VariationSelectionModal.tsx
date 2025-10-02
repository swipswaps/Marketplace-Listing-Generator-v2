import React, { useState } from 'react';
import type { Listing } from '../types';
import { CloseIcon, CheckIcon, SparklesIcon, InfoIcon, LinkIcon } from './icons';

interface VariationSelectionModalProps {
  variations: Omit<Listing, 'id' | 'createdAt'>[];
  onSelect: (listing: Omit<Listing, 'id' | 'createdAt'>, selectedPrice: number) => void;
  onClose: () => void;
}

const PriceButton: React.FC<{
    label: string;
    price: number;
    isSelected: boolean;
    onClick: () => void;
}> = ({ label, price, isSelected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 text-left p-3 rounded-lg border-2 transition-all ${
                isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-white border-slate-300 hover:border-indigo-500 hover:bg-indigo-50'
            }`}
        >
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
            <span className="block text-xl font-bold text-slate-800">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)}
            </span>
        </button>
    );
};

export const VariationSelectionModal: React.FC<VariationSelectionModalProps> = ({ variations, onSelect, onClose }) => {
    const [selections, setSelections] = useState<{ [key: number]: { price: number | null; isAdded: boolean } }>(
        variations.reduce((acc, _, index) => ({ ...acc, [index]: { price: null, isAdded: false } }), {})
    );

    const handlePriceSelect = (index: number, price: number) => {
        setSelections(prev => ({
            ...prev,
            [index]: { ...prev[index], price }
        }));
    };
    
    const handleAdd = (variation: Omit<Listing, 'id' | 'createdAt'>, index: number) => {
        const selectedPrice = selections[index].price;
        if (selectedPrice === null) return;

        onSelect(variation, selectedPrice);
        setSelections(prev => ({
            ...prev,
            [index]: { ...prev[index], isAdded: true }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-6 border-b border-slate-200 bg-white rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <SparklesIcon className="h-7 w-7 text-indigo-600"/>
                        <h2 className="text-2xl font-bold text-slate-800">Choose Your Listing</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close">
                        <CloseIcon className="h-6 w-6 text-slate-500"/>
                    </button>
                </header>

                <p className="px-6 py-4 text-slate-600 text-center bg-white border-b border-slate-200 flex-shrink-0">
                    We've generated a few variations based on market data. Select a price for your favorite(s) to add them to your history.
                </p>
                
                <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {variations.map((variation, index) => {
                            const selection = selections[index];
                            const isAdded = selection.isAdded;
                            return (
                                <div key={index} className="bg-white rounded-xl shadow-lg flex flex-col transition-all hover:shadow-2xl">
                                    <div className="p-6 flex-grow flex flex-col">
                                        <h3 className="text-lg font-bold text-slate-900">{variation.title}</h3>
                                        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full self-start mt-2">{variation.category}</span>
                                        <p className="mt-4 text-sm text-slate-600 line-clamp-4 flex-grow">
                                            {variation.description}
                                        </p>
                                        
                                        <div className="mt-6 space-y-3">
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <h5 className="font-semibold text-slate-700 text-sm flex items-center mb-2">
                                                    <InfoIcon className="h-4 w-4 mr-2 text-slate-400"/>
                                                    Pricing Rationale
                                                </h5>
                                                <p className="text-xs text-slate-600 italic">
                                                    {variation.priceSuggestion.justification}
                                                </p>
                                            </div>
                                            {variation.priceSuggestion.sources && variation.priceSuggestion.sources.length > 0 && (
                                                <div className="bg-slate-50 p-3 rounded-lg">
                                                    <h5 className="font-semibold text-slate-700 text-sm flex items-center mb-2">
                                                        <LinkIcon className="h-4 w-4 mr-2 text-slate-400"/>
                                                        Cited Sources
                                                    </h5>
                                                    <ul className="space-y-1">
                                                        {variation.priceSuggestion.sources.map((source, i) => (
                                                            <li key={i}>
                                                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline break-all" title={source.url}>
                                                                    {source.title || "View Source"}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-100 mt-auto space-y-4">
                                        <h4 className="text-sm font-semibold text-center text-slate-700">Select a Price Point</h4>
                                        <div className="flex gap-3">
                                            <PriceButton label="Quick Sale" price={variation.priceSuggestion.quickSale} isSelected={selection.price === variation.priceSuggestion.quickSale} onClick={() => handlePriceSelect(index, variation.priceSuggestion.quickSale)} />
                                            <PriceButton label="Market Value" price={variation.priceSuggestion.marketValue} isSelected={selection.price === variation.priceSuggestion.marketValue} onClick={() => handlePriceSelect(index, variation.priceSuggestion.marketValue)} />
                                            <PriceButton label="Premium" price={variation.priceSuggestion.premium} isSelected={selection.price === variation.priceSuggestion.premium} onClick={() => handlePriceSelect(index, variation.priceSuggestion.premium)} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-b-xl">
                                        <button 
                                            onClick={() => handleAdd(variation, index)}
                                            disabled={isAdded || selection.price === null}
                                            className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors ${
                                                isAdded ? 'bg-green-500 cursor-default' : 
                                                selection.price === null ? 'bg-slate-300 cursor-not-allowed' :
                                                'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                            }`}
                                        >
                                            {isAdded ? (
                                                <>
                                                    <CheckIcon className="mr-2 h-5 w-5" />
                                                    Added to History
                                                </>
                                            ) : 'Add to History'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
                
                <footer className="flex items-center justify-end p-6 border-t border-slate-200 bg-white rounded-b-2xl flex-shrink-0">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                        Done
                    </button>
                </footer>
            </div>
        </div>
    );
};
