import React, { useState, useEffect, useMemo } from 'react';
import { ImagePreview } from './components/ImagePreview';
import { ListingHistory } from './components/ListingHistory';
import { UploadIcon, SparklesIcon, SettingsIcon, CloseIcon, CheckIcon, ErrorIcon } from './components/icons';
import { generateListing, verifyGeminiApiKey } from './services/geminiService';
import { verifyEbayToken } from './services/ebayService';
import { verifyTwitterCredentials } from './services/twitterService';
import type { Listing } from './types';

interface ApiKeys {
  gemini: string;
  ebay: string;
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
}

const App: React.FC = () => {
  // Form State
  const [images, setImages] = useState<File[]>([]);
  const [notes, setNotes] = useState<string>('');
  
  // App State
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: '',
    ebay: '',
    twitter: { apiKey: '', apiSecret: '', accessToken: '', accessSecret: '' },
  });

  // History Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [filterCategory, setFilterCategory] = useState('all');

  // Load initial state from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
    const savedListings = localStorage.getItem('listings');
    if (savedListings) {
      setListings(JSON.parse(savedListings));
    }
  }, []);

  // Persist listings to localStorage
  useEffect(() => {
    localStorage.setItem('listings', JSON.stringify(listings));
  }, [listings]);
  
  const isEbayConfigured = !!apiKeys.ebay;
  const isTwitterConfigured = !!apiKeys.twitter.apiKey && !!apiKeys.twitter.apiSecret && !!apiKeys.twitter.accessToken && !!apiKeys.twitter.accessSecret;

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setImages(prev => [...prev, ...newFiles].slice(0, 4));
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    if (!apiKeys.gemini) {
        setError('Please set your Gemini API key in the settings.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedData = await generateListing(images, notes, apiKeys.gemini, isEbayConfigured, isTwitterConfigured);
      const newListing: Listing = {
        ...generatedData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setListings(prev => [newListing, ...prev]);
      // Reset form after successful generation
      setImages([]);
      setNotes('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteListing = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
  };
  
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all listings? This cannot be undone.')) {
        setListings([]);
    }
  };

  // Derived state for filtered and sorted listings
  const filteredAndSortedListings = useMemo(() => {
    return listings
      .filter(listing => {
        // Category filter
        if (filterCategory !== 'all' && listing.category !== filterCategory) {
          return false;
        }
        // Search filter
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (lowerSearchTerm && 
            !listing.title.toLowerCase().includes(lowerSearchTerm) && 
            !listing.description.toLowerCase().includes(lowerSearchTerm)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'price-desc':
            return b.price - a.price;
          case 'price-asc':
            return a.price - b.price;
          case 'date-desc':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [listings, searchTerm, sortOrder, filterCategory]);

  const availableCategories = useMemo(() => ['all', ...Array.from(new Set(listings.map(l => l.category)))], [listings]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">AI Listing Generator</h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-100" aria-label="Settings">
            <SettingsIcon className="h-6 w-6 text-slate-600" />
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">1. Add a New Product</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div 
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragEvents}
                onDrop={handleDrop}
              >
                <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                <label htmlFor="file-upload" className="relative cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-indigo-600">
                    Click to upload
                  </span>
                  <span className="mt-1 block text-xs text-slate-500"> or drag and drop</span>
                </label>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  multiple 
                  accept="image/*"
                  onChange={e => handleFileChange(e.target.files)}
                />
                <p className="text-xs text-slate-500 mt-2">PNG, JPG, etc. Max 4 images.</p>
              </div>

              <ImagePreview images={images} onRemove={handleRemoveImage} />
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                  Optional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="e.g., 'Slight scratch on the back', 'Never opened', 'Comes with original box'"
                />
              </div>

               {error && (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex items-center space-x-4">
                 <button
                  type="submit"
                  disabled={isLoading || images.length === 0 || !apiKeys.gemini}
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Generating...' : 'Generate & Add to History'}
                  <SparklesIcon className={`ml-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
               {!apiKeys.gemini && (
                  <p className="text-center text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
                    Please add your Gemini API Key in settings to enable generation.
                  </p>
                )}
            </form>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <ListingHistory
              listings={filteredAndSortedListings}
              apiKeys={apiKeys}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              availableCategories={availableCategories}
              onDelete={handleDeleteListing}
              onClear={handleClearHistory}
              isEbayConfigured={isEbayConfigured}
              isTwitterConfigured={isTwitterConfigured}
            />
          </div>
        </div>
      </main>
      
      {isSettingsOpen && (
        <SettingsModal 
          initialKeys={apiKeys} 
          onClose={() => setIsSettingsOpen(false)} 
          onSave={(newKeys) => {
            setApiKeys(newKeys);
            localStorage.setItem('apiKeys', JSON.stringify(newKeys));
            setIsSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
};

interface SettingsModalProps {
  initialKeys: ApiKeys;
  onClose: () => void;
  onSave: (keys: ApiKeys) => void;
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

const SettingsModal: React.FC<SettingsModalProps> = ({ initialKeys, onClose, onSave }) => {
  const [keys, setKeys] = useState<ApiKeys>(initialKeys);
  const [validationStatus, setValidationStatus] = useState({
    gemini: 'idle' as ValidationStatus,
    ebay: 'idle' as ValidationStatus,
    twitter: 'idle' as ValidationStatus
  });

  const handleVerifyGemini = async () => {
    setValidationStatus(prev => ({ ...prev, gemini: 'validating' }));
    const isValid = await verifyGeminiApiKey(keys.gemini);
    setValidationStatus(prev => ({ ...prev, gemini: isValid ? 'valid' : 'invalid' }));
  };
  
  const handleVerifyEbay = async () => {
    setValidationStatus(prev => ({ ...prev, ebay: 'validating' }));
    const isValid = await verifyEbayToken(keys.ebay);
    setValidationStatus(prev => ({ ...prev, ebay: isValid ? 'valid' : 'invalid' }));
  };

  const handleVerifyTwitter = async () => {
    setValidationStatus(prev => ({ ...prev, twitter: 'validating' }));
    const isValid = await verifyTwitterCredentials(keys.twitter);
    setValidationStatus(prev => ({ ...prev, twitter: isValid ? 'valid' : 'invalid' }));
  };
  
  const handleSave = () => {
    onSave(keys);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('twitter.')) {
        const twitterKey = name.split('.')[1] as keyof ApiKeys['twitter'];
        setKeys(prev => ({
            ...prev,
            twitter: { ...prev.twitter, [twitterKey]: value }
        }));
        setValidationStatus(prev => ({ ...prev, twitter: 'idle' }));
    } else {
        setKeys(prev => ({ ...prev, [name]: value }));
        if (name === 'gemini' || name === 'ebay') {
           setValidationStatus(prev => ({ ...prev, [name]: 'idle' }));
        }
    }
  };
  
  const StatusIndicator: React.FC<{ status: ValidationStatus }> = ({ status }) => {
    switch (status) {
      case 'validating':
        return <SparklesIcon className="h-5 w-5 text-slate-400 animate-spin" />;
      case 'valid':
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <ErrorIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-6 w-6 text-slate-700"/>
            <h2 className="text-xl font-semibold text-slate-800">API Key Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <CloseIcon className="h-5 w-5 text-slate-500"/>
          </button>
        </div>
        
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Gemini Settings */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Google Gemini</h3>
            <p className="text-sm text-slate-500">Required for generating all listings.</p>
            <div>
                <label htmlFor="gemini" className="block text-sm font-medium text-slate-700">API Key</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="password" name="gemini" id="gemini" value={keys.gemini} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                  <button onClick={handleVerifyGemini} disabled={!keys.gemini || validationStatus.gemini === 'validating'} className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50">Verify</button>
                  <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={validationStatus.gemini} /></div>
                </div>
                {validationStatus.gemini === 'invalid' && <p className="text-xs text-red-600 mt-1">Invalid Gemini API Key.</p>}
            </div>
          </div>

          {/* eBay Settings */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">eBay</h3>
            <p className="text-sm text-slate-500">Optional. Required to enable the "List on eBay" feature.</p>
            <div>
                <label htmlFor="ebay" className="block text-sm font-medium text-slate-700">OAuth Token</label>
                 <div className="flex items-center space-x-2 mt-1">
                    <input type="password" name="ebay" id="ebay" value={keys.ebay} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    <button onClick={handleVerifyEbay} disabled={!keys.ebay || validationStatus.ebay === 'validating'} className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50">Verify</button>
                    <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={validationStatus.ebay} /></div>
                </div>
                 {validationStatus.ebay === 'invalid' && <p className="text-xs text-red-600 mt-1">Invalid or expired eBay Token.</p>}
            </div>
          </div>

          {/* Twitter Settings */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">X (Twitter)</h3>
            <p className="text-sm text-slate-500">Optional. Required to enable the "Post to X" feature.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="twitter.apiKey" className="block text-sm font-medium text-slate-700">API Key</label>
                    <input type="password" name="twitter.apiKey" id="twitter.apiKey" value={keys.twitter.apiKey} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="twitter.apiSecret" className="block text-sm font-medium text-slate-700">API Key Secret</label>
                    <input type="password" name="twitter.apiSecret" id="twitter.apiSecret" value={keys.twitter.apiSecret} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="twitter.accessToken" className="block text-sm font-medium text-slate-700">Access Token</label>
                    <input type="password" name="twitter.accessToken" id="twitter.accessToken" value={keys.twitter.accessToken} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="twitter.accessSecret" className="block text-sm font-medium text-slate-700">Access Token Secret</label>
                    <input type="password" name="twitter.accessSecret" id="twitter.accessSecret" value={keys.twitter.accessSecret} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
            </div>
             <p className="text-xs text-slate-500 !mt-2">For security reasons, verification only checks if fields are non-empty. Full Twitter API integration must be handled server-side.</p>
            <div className="flex items-center space-x-2 mt-2">
                <button 
                  onClick={handleVerifyTwitter} 
                  disabled={Object.values(keys.twitter).some(k => !k) || validationStatus.twitter === 'validating'} 
                  className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
                >
                  Verify
                </button>
                <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={validationStatus.twitter} /></div>
            </div>
            {validationStatus.twitter === 'invalid' && <p className="text-xs text-red-600 mt-1">All four Twitter keys are required.</p>}
          </div>
        </div>
        
        <div className="flex items-center justify-end p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;