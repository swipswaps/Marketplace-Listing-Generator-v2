import React, { useState } from 'react';
import type { Listing } from '../types';
import { CloseIcon, CheckIcon, SparklesIcon } from './icons';

interface VariationSelectionModalProps {
  variations: Omit<Listing, 'id' | 'createdAt'>[];
  onSelect: (listing: Omit<Listing, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const VariationSelectionModal: React.FC<VariationSelectionModalProps> = ({ variations, onSelect, onClose }) => {
    const [addedIndices, setAddedIndices] = useState<number[]>([]);

    const handleSelect = (variation: Omit<Listing, 'id' | 'createdAt'>, index: number) => {
        onSelect(variation);
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
                    We've generated a few variations. Pick your favorite(s) to add to your history.
                </p>
                
                <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {variations.map((variation, index) => {
                            const isAdded = addedIndices.includes(index);
                            return (
                                <div key={index} className="bg-white rounded-xl shadow-lg flex flex-col transition-all hover:shadow-2xl hover:scale-[1.02]">
                                    <div className="p-6 flex-grow flex flex-col">
                                        <h3 className="text-lg font-bold text-slate-900">{variation.title}</h3>
                                        <div className="flex items-baseline space-x-2 mt-2">
                                            <span className="text-2xl font-bold text-indigo-600">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(variation.price)}
                                            </span>
                                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{variation.category}</span>
                                        </div>
                                        <p className="mt-4 text-sm text-slate-600 line-clamp-5 flex-grow">
                                            {variation.description.split('\n').filter(p => p.trim()).map((p, i) => <React.Fragment key={i}>{p}<br/></React.Fragment>)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-b-xl mt-auto">
                                        <button 
                                            onClick={() => handleSelect(variation, index)}
                                            disabled={isAdded}
                                            className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors ${isAdded ? 'bg-green-500 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
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