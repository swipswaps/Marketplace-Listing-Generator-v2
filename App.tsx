import React, { useState, useEffect, useMemo } from 'react';
import { ImagePreview } from './components/ImagePreview';
import { ListingHistory } from './components/ListingHistory';
import { UploadIcon, SparklesIcon, SettingsIcon, CloseIcon, CheckIcon, ErrorIcon, SunIcon, MoonIcon } from './components/icons';
import { generateListing } from './services/geminiService';
import { verifyEbayToken } from './services/ebayService';
import { verifyTwitterCredentials } from './services/twitterService';
import type { Listing } from './types';
import { VariationSelectionModal } from './components/VariationSelectionModal';

interface ApiKeys {
  ebay: string;
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
}

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  // Form State
  const [images, setImages] = useState<File[]>([]);
  const [notes, setNotes] = useState<string>('');
  
  // App State
  const [listings, setListings] = useState<Listing[]>([]);
  const [variations, setVariations] = useState<Omit<Listing, 'id' | 'createdAt'>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>('light');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    ebay: '',
    twitter: { apiKey: '', apiSecret: '', accessToken: '', accessSecret: '' },
  });

  // History Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [filterCategory, setFilterCategory] = useState('all');

  // Load initial state from localStorage
  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }

    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys);
      delete parsedKeys.gemini;
      setApiKeys(parsedKeys);
    }
    const savedListings = localStorage.getItem('listings');
    if (savedListings) {
      setListings(JSON.parse(savedListings));
    }
  }, []);

  // Persist listings and theme to localStorage
  useEffect(() => {
    localStorage.setItem('listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedData = await generateListing(images, notes, isEbayConfigured, isTwitterConfigured);
      setVariations(generatedData);
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

  const handleSelectVariation = (variation: Omit<Listing, 'id' | 'createdAt'>) => {
    const newListing: Listing = {
      ...variation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setListings(prev => [newListing, ...prev]);
  };

  const handleDeleteListing = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
  };
  
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all listings? This cannot be undone.')) {
        setListings([]);
    }
  };

  const filteredAndSortedListings = useMemo(() => {
    return listings
      .filter(listing => {
        if (filterCategory !== 'all' && listing.category !== filterCategory) {
          return false;
        }
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
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <header className="bg-white dark:bg-slate-800 shadow-sm dark:border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Listing Generator</h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Settings">
            <SettingsIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">1. Add a New Product</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div 
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragEvents}
                onDrop={handleDrop}
              >
                <UploadIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                <label htmlFor="file-upload" className="relative cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Click to upload
                  </span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400"> or drag and drop</span>
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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">PNG, JPG, etc. Max 4 images.</p>
              </div>

              <ImagePreview images={images} onRemove={handleRemoveImage} />
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Optional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="e.g., 'Slight scratch on the back', 'Never opened', 'Comes with original box'"
                />
              </div>

               {error && (
                <div className="text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex items-center space-x-4">
                 <button
                  type="submit"
                  disabled={isLoading || images.length === 0}
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Generating...' : 'Generate Listing Variations'}
                  <SparklesIcon className={`ml-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
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
      
      {variations && (
        <VariationSelectionModal 
          variations={variations}
          onSelect={handleSelectVariation}
          onClose={() => setVariations(null)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          initialKeys={apiKeys}
          theme={theme}
          onThemeChange={setTheme}
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
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClose: () => void;
  onSave: (keys: ApiKeys) => void;
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

const SettingsModal: React.FC<SettingsModalProps> = ({ initialKeys, theme, onThemeChange, onClose, onSave }) => {
  const [keys, setKeys] = useState<ApiKeys>(initialKeys);
  const [validationStatus, setValidationStatus] = useState({
    ebay: 'idle' as ValidationStatus,
    twitter: 'idle' as ValidationStatus
  });

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
        const key = name as keyof Omit<ApiKeys, 'twitter'>;
        setKeys(prev => ({ ...prev, [key]: value }));
        if (name === 'ebay') {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-6 w-6 text-slate-700 dark:text-slate-300"/>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <CloseIcon className="h-5 w-5 text-slate-500 dark:text-slate-400"/>
          </button>
        </div>
        
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Theme Toggle */}
           <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Appearance</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <label htmlFor="theme-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    {theme === 'light' ? <SunIcon className="h-5 w-5 mr-2 text-slate-500" /> : <MoonIcon className="h-5 w-5 mr-2 text-slate-400" />}
                    Dark Mode
                </label>
                <button
                    type="button"
                    id="theme-toggle"
                    onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    aria-pressed={theme === 'dark'}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
            </div>
          </div>

          {/* Gemini Info */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Google Gemini</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The Google Gemini API key is managed securely via an environment variable (<code>process.env.API_KEY</code>) and does not need to be configured here.
            </p>
          </div>

          {/* eBay Settings */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">eBay</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Optional. Required to enable the "List on eBay" feature.</p>
            <div>
                <label htmlFor="ebay" className="block text-sm font-medium text-slate-700 dark:text-slate-300">OAuth Token</label>
                 <div className="flex items-center space-x-2 mt-1">
                    <input type="password" name="ebay" id="ebay" value={keys.ebay} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    <button onClick={handleVerifyEbay} disabled={!keys.ebay || validationStatus.ebay === 'validating'} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">Verify</button>
                    <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={validationStatus.ebay} /></div>
                </div>
                 {validationStatus.ebay === 'invalid' && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Invalid or expired eBay Token.</p>}
            </div>
          </div>

          {/* Twitter Settings */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">X (Twitter)</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Optional. Required to enable the "Post to X" feature.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="twitter.apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">API Key</label>
                    <input type="password" name="twitter.apiKey" id="twitter.apiKey" value={keys.twitter.apiKey} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="twitter.apiSecret" className="block text-sm font-medium text-slate-700 dark:text-slate-300">API Key Secret</label>
                    <input type="password" name="twitter.apiSecret" id="twitter.apiSecret" value={keys.twitter.apiSecret} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="twitter.accessToken" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Access Token</label>
                    <input type="password" name="twitter.accessToken" id="twitter.accessToken" value={keys.twitter.accessToken} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="twitter.accessSecret" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Access Token Secret</label>
                    <input type="password" name="twitter.accessSecret" id="twitter.accessSecret" value={keys.twitter.accessSecret} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 !mt-2">For security reasons, verification only checks if fields are non-empty. Full Twitter API integration must be handled server-side.</p>
            <div className="flex items-center space-x-2 mt-2">
                <button 
                  onClick={handleVerifyTwitter} 
                  disabled={Object.values(keys.twitter).some(k => !k) || validationStatus.twitter === 'validating'} 
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Verify
                </button>
                <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={validationStatus.twitter} /></div>
            </div>
            {validationStatus.twitter === 'invalid' && <p className="text-xs text-red-600 dark:text-red-400 mt-1">All four Twitter keys are required.</p>}
          </div>
        </div>
        
        <div className="flex items-center justify-end p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;