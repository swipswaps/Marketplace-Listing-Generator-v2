import React, { useState } from 'react';
import type { Listing } from '../types';
import { CloseIcon, CheckIcon, SparklesIcon, InfoIcon } from './icons';

interface VariationSelectionModalProps {
  variations: Omit<Listing, 'id' | 'createdAt' | 'selectedPrice'>[];
  onSelect: (listing: Omit<Listing, 'id' | 'createdAt' | 'selectedPrice'>, selectedPrice: number) => void;
  onClose: () => void;
}

const PriceButton: React.FC<{
    label: string;
    price: number;
    isSelected: boolean;
    onClick: () => void;
}> = ({ label, price, isSelected, onClick }) => {
    const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isSelected ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300' : 'bg-white border-slate-300 hover:border-indigo-400'}`}
        >
            <span className={`block text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</span>
            <span className={`block text-lg font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{formattedPrice}</span>
        </button>
    );
};

export const VariationSelectionModal: React.FC<VariationSelectionModalProps> = ({ variations, onSelect, onClose }) => {
    const [addedIndices, setAddedIndices] = useState<number[]>([]);
    const [selectedPrices, setSelectedPrices] = useState<{ [index: number]: number | null }>({});

    const handlePriceSelect = (variationIndex: number, price: number) => {
        setSelectedPrices(prev => ({
            ...prev,
            [variationIndex]: price,
        }));
    };

    const handleAdd = (variation: Omit<Listing, 'id' | 'createdAt' | 'selectedPrice'>, index: number) => {
        const selectedPrice = selectedPrices[index];
        if (selectedPrice === null || typeof selectedPrice === 'undefined') return;

        onSelect(variation, selectedPrice);
        setAddedIndices(prev => [...prev, index]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                    We've generated a few variations with market-based price suggestions. Pick your favorite price for each, then add them to your history.
                </p>
                
                <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {variations.map((variation, index) => {
                            const isAdded = addedIndices.includes(index);
                            const currentSelectedPrice = selectedPrices[index];
                            return (
                                <div key={index} className="bg-white rounded-xl shadow-lg flex flex-col transition-all hover:shadow-2xl hover:scale-[1.02]">
                                    <div className="p-6 flex-grow flex flex-col">
                                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{variation.title}</h3>
                                        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full self-start mt-2">{variation.category}</span>
                                        
                                        <div className="mt-4 space-y-2">
                                            <PriceButton label="Quick Sale" price={variation.priceSuggestion.quickSale} isSelected={currentSelectedPrice === variation.priceSuggestion.quickSale} onClick={() => handlePriceSelect(index, variation.priceSuggestion.quickSale)} />
                                            <PriceButton label="Market Value" price={variation.priceSuggestion.marketValue} isSelected={currentSelectedPrice === variation.priceSuggestion.marketValue} onClick={() => handlePriceSelect(index, variation.priceSuggestion.marketValue)} />
                                            <PriceButton label="Premium" price={variation.priceSuggestion.premium} isSelected={currentSelectedPrice === variation.priceSuggestion.premium} onClick={() => handlePriceSelect(index, variation.priceSuggestion.premium)} />
                                        </div>

                                        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <div className="flex items-start space-x-2.5">
                                                <InfoIcon className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-800">Pricing Rationale</h4>
                                                    <p className="text-xs text-slate-600 mt-1">{variation.priceSuggestion.justification}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm text-slate-600 line-clamp-3 flex-grow">
                                            {variation.description.split('\n').filter(p => p.trim()).map((p, i) => <React.Fragment key={i}>{p}<br/></React.Fragment>)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-b-xl mt-auto">
                                        <button 
                                            onClick={() => handleAdd(variation, index)}
                                            disabled={isAdded || currentSelectedPrice === null || typeof currentSelectedPrice === 'undefined'}
                                            className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors ${isAdded ? 'bg-green-500 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'} disabled:bg-slate-300 disabled:cursor-not-allowed`}
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
