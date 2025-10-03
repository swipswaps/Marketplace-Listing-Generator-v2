import React, { useState, useEffect, useRef } from 'react';
import type { Listing, ListingVariation, ApiKeys } from './types';
import { generateListings, verifyGeminiKey } from './services/geminiService';
import { dbService } from './services/dbService';
import { postToX, verifyTwitterCredentials } from './services/twitterService';
import { postToEbay, verifyEbayCredentials } from './services/ebayService';
import toast, { Toaster } from 'react-hot-toast';

import { UploadIcon, SparklesIcon, SettingsIcon, CloseIcon, CheckIcon, ErrorIcon, InfoIcon } from './components/icons';
import { ImagePreview } from './components/ImagePreview';
import { VariationSelectionModal } from './components/VariationSelectionModal';
import { ListingHistory } from './components/ListingHistory';
import { EditListingModal } from './components/EditListingModal';
import { EbayRefinementModal } from './components/EbayRefinementModal';

const initialApiKeys: ApiKeys = {
    geminiApiKey: '',
    ebayAppId: '',
    ebayUserToken: '',
    ebayEnvironment: 'production',
    twitterApiKey: '',
    twitterApiSecret: '',
    twitterAccessToken: '',
    twitterAccessSecret: ''
};

const App: React.FC = () => {
    // State
    const [images, setImages] = useState<File[]>([]);
    const [userQuery, setUserQuery] = useState('');
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [variations, setVariations] = useState<ListingVariation[]>([]);
    const [imageKeysForVariations, setImageKeysForVariations] = useState<string[]>([]);
    const [showVariationModal, setShowVariationModal] = useState(false);
    const [editingListing, setEditingListing] = useState<Listing | null>(null);
    const [refiningEbayListing, setRefiningEbayListing] = useState<Listing | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    // API Config State
    const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
        try {
            const savedApiKeys = localStorage.getItem('apiKeys');
            const parsedKeys = savedApiKeys ? JSON.parse(savedApiKeys) : {};
            // Merge with defaults to ensure all keys are present and prevent errors
            return { ...initialApiKeys, ...parsedKeys };
        } catch {
            return initialApiKeys;
        }
    });
    
    useEffect(() => {
        try {
            const savedListings = localStorage.getItem('generatedListings');
            if (savedListings) {
                setListings(JSON.parse(savedListings));
            }
        } catch (e) {
            console.error("Failed to load listings from localStorage", e);
        }
    }, []);

    // Save state to local storage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('generatedListings', JSON.stringify(listings));
        } catch (e) {
            console.error("Failed to save listings to localStorage", e);
        }
    }, [listings]);
    
     useEffect(() => {
        try {
            localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
        } catch (e) {
            console.error("Failed to save apiKeys to localStorage", e);
        }
    }, [apiKeys]);


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles].slice(0, 5));
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleGenerate = async () => {
        if (!apiKeys.geminiApiKey) {
            setError("Please set your Gemini API key in the settings.");
            toast.error("Please set your Gemini API key in the settings.");
            return;
        }
        if (images.length === 0) {
            setError("Please upload at least one image.");
            return;
        }
        if (!userQuery.trim()) {
            setError("Please describe the item you are selling.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const imageKeys = await dbService.saveImages(images);
            setImageKeysForVariations(imageKeys);
            const result = await generateListings(images, userQuery, apiKeys.geminiApiKey);
            setVariations(result);
            setShowVariationModal(true);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectVariation = (variation: ListingVariation, selectedPrice: number) => {
        const newListing: Listing = {
            ...variation,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            selectedPrice,
            images: imageKeysForVariations,
        };
        setListings(prev => [newListing, ...prev]);
    };

    const handleDeleteListing = async (id: string) => {
        const listingToDelete = listings.find(l => l.id === id);
        if (listingToDelete) {
            await dbService.deleteImages(listingToDelete.images);
            setListings(prev => prev.filter(l => l.id !== id));
        }
    };

    const handleSaveListing = (updatedListing: Listing) => {
        setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
        setEditingListing(null);
    };
    
    const handlePostEbay = async (listing: Listing) => {
        setIsPosting(true);
        try {
            postToEbay(listing, apiKeys);
            toast.success("Redirecting to eBay to complete your listing...");
        } catch (e: any) {
            toast.error(`An error occurred: ${e.message}`);
        } finally {
            setIsPosting(false);
            setRefiningEbayListing(null);
        }
    };
    
    const handleSaveRefinedListing = (refinedListing: Listing) => {
        handleSaveListing(refinedListing);
        handlePostEbay(refinedListing);
    };

    const handlePostTwitter = (listing: Listing) => {
        try {
            postToX(listing, apiKeys);
        } catch (e: any) {
             toast.error(`An error occurred while posting to X: ${e.message}`);
        }
    };

    const isEbayConfigured = !!(apiKeys.ebayAppId && apiKeys.ebayUserToken);
    const isTwitterConfigured = !!(apiKeys.twitterApiKey && apiKeys.twitterApiSecret && apiKeys.twitterAccessToken && apiKeys.twitterAccessSecret);

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <Toaster position="top-center" reverseOrder={false} />
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <SparklesIcon className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-slate-900">AI Listing Generator</h1>
                        </div>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-100" aria-label="Settings">
                            <SettingsIcon className="h-6 w-6 text-slate-600" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Form Sections... */}
                <section className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">1. Upload Your Images</h2>
                    <div 
                        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-2 text-sm text-slate-600">
                            Drag & drop files or <span className="font-semibold text-indigo-600">browse</span>
                        </p>
                        <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP. Max 5 images.</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <ImagePreview images={images} onRemove={handleRemoveImage} />
                </section>

                <section className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">2. Describe Your Item</h2>
                    <textarea
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder="e.g., 'Vintage Star Wars action figure, good condition, includes original blaster'"
                        className="w-full block rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={3}
                    />
                </section>
                
                <section>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || images.length === 0 || !userQuery.trim()}
                        className="w-full flex items-center justify-center text-lg font-semibold px-8 py-4 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                         {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                             <>
                                <SparklesIcon className="h-6 w-6 mr-3" />
                                Generate Listings
                            </>
                        )}
                    </button>
                    {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
                </section>

                <hr className="border-slate-200" />
                
                <ListingHistory 
                    listings={listings}
                    onEdit={setEditingListing}
                    onDelete={handleDeleteListing}
                    onPostEbay={setRefiningEbayListing}
                    onPostTwitter={handlePostTwitter}
                    isEbayConfigured={isEbayConfigured}
                    isTwitterConfigured={isTwitterConfigured}
                />
            </main>

            {/* Modals */}
            {isSettingsOpen && (
                <SettingsModal 
                    apiKeys={apiKeys}
                    onSave={setApiKeys}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
            {showVariationModal && (
                <VariationSelectionModal 
                    variations={variations}
                    onSelect={handleSelectVariation}
                    onClose={() => {
                        setShowVariationModal(false);
                        setImageKeysForVariations([]);
                    }}
                />
            )}
            {editingListing && (
                <EditListingModal 
                    listing={editingListing}
                    onSave={handleSaveListing}
                    onClose={() => setEditingListing(null)}
                />
            )}
            {refiningEbayListing && (
                 <EbayRefinementModal 
                    listing={refiningEbayListing}
                    onPost={handleSaveRefinedListing}
                    onClose={() => setRefiningEbayListing(null)}
                    isPosting={isPosting}
                    apiKeys={apiKeys}
                />
            )}
        </div>
    );
};

// --- Settings Modal ---
interface SettingsModalProps {
    apiKeys: ApiKeys;
    onSave: (keys: ApiKeys) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ apiKeys, onSave, onClose }) => {
    const [localKeys, setLocalKeys] = useState<ApiKeys>(apiKeys);
    const [verificationStatus, setVerificationStatus] = useState<{ [key: string]: 'idle' | 'verifying' | 'success' | 'error' }>({
        gemini: 'idle',
        ebay: 'idle',
        twitter: 'idle'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalKeys(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = () => {
        onSave(localKeys);
        onClose();
        toast.success("Settings saved!");
    };

    const handleVerifyGemini = async () => {
        setVerificationStatus(prev => ({ ...prev, gemini: 'verifying' }));
        const result = await verifyGeminiKey(localKeys.geminiApiKey);
        if (result.success) {
            setVerificationStatus(prev => ({ ...prev, gemini: 'success' }));
            toast.success("Gemini API key verified successfully!");
        } else {
            setVerificationStatus(prev => ({ ...prev, gemini: 'error' }));
            toast.error(`Gemini verification failed: ${result.error}`);
        }
    };

    const handleVerifyEbay = async () => {
        setVerificationStatus(prev => ({ ...prev, ebay: 'verifying' }));
        const result = await verifyEbayCredentials(localKeys);
        if (result.success) {
            setVerificationStatus(prev => ({ ...prev, ebay: 'success' }));
            toast.success("eBay credentials verified successfully!");
        } else {
            setVerificationStatus(prev => ({ ...prev, ebay: 'error' }));
            toast.error(`eBay verification failed: ${result.error}`);
        }
    };
    
    const handleVerifyTwitter = async () => {
        setVerificationStatus(prev => ({ ...prev, twitter: 'verifying' }));
        const isValid = await verifyTwitterCredentials(localKeys);
         if (isValid) {
            setVerificationStatus(prev => ({ ...prev, twitter: 'success' }));
            toast.success("Twitter credentials appear valid!");
        } else {
            setVerificationStatus(prev => ({ ...prev, twitter: 'error' }));
            toast.error("One or more Twitter keys are missing.");
        }
    };

    const isSandbox = localKeys.ebayEnvironment === 'sandbox';

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">API Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><CloseIcon className="h-6 w-6 text-slate-500"/></button>
                </header>
                <main className="p-6 overflow-y-auto space-y-6">
                    {/* Gemini Settings */}
                     <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-slate-800">Google Gemini API (Required)</legend>
                        <div className="p-3 bg-slate-100 rounded-md text-sm text-slate-600 flex items-start space-x-2">
                            <InfoIcon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0"/>
                            <span>This is required for the core functionality. You can get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">Google AI Studio</a>.</span>
                        </div>
                        <div>
                            <label htmlFor="geminiApiKey" className="block text-sm font-medium text-slate-700">API Key</label>
                            <input type="password" name="geminiApiKey" id="geminiApiKey" value={localKeys.geminiApiKey} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={handleVerifyGemini} disabled={!localKeys.geminiApiKey || verificationStatus.gemini === 'verifying'} className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                                {verificationStatus.gemini === 'verifying' && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {verificationStatus.gemini === 'success' && <CheckIcon className="h-4 w-4 mr-2 text-green-500"/>}
                                {verificationStatus.gemini === 'error' && <ErrorIcon className="h-4 w-4 mr-2 text-red-500"/>}
                                Verify
                            </button>
                        </div>
                    </fieldset>

                     <hr className="border-slate-200" />
                    
                    {/* eBay Settings */}
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-slate-800">eBay API (Optional)</legend>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Environment</label>
                            <div className="flex rounded-md shadow-sm">
                                <button type="button" onClick={() => setLocalKeys(p => ({...p, ebayEnvironment: 'production'}))} className={`flex-1 px-4 py-2 text-sm font-semibold border border-slate-300 rounded-l-md ${!isSandbox ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>Production (Live)</button>
                                <button type="button" onClick={() => setLocalKeys(p => ({...p, ebayEnvironment: 'sandbox'}))} className={`flex-1 px-4 py-2 text-sm font-semibold border-t border-b border-r border-slate-300 rounded-r-md ${isSandbox ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>Sandbox (Testing)</button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-100 rounded-lg space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-800">Step 1: Get your Application Keys</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    Your <strong>App ID (Client ID)</strong> identifies your application with eBay. You need to create a keyset for the {isSandbox ? 'Sandbox' : 'Production'} environment.
                                </p>
                                <a 
                                    href={isSandbox ? "https://developer.ebay.com/my/keys?env=sandbox" : "https://developer.ebay.com/my/keys?env=production"} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm font-semibold text-indigo-600 hover:underline mt-2 inline-block"
                                >
                                    Create or View your {isSandbox ? 'Sandbox' : 'Production'} Keyset &rarr;
                                </a>
                            </div>
                            <hr className="border-slate-200"/>
                            <div>
                                <h4 className="font-semibold text-slate-800">Step 2: Get an OAuth User Token</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    A <strong>User Token</strong> proves you have given this application permission to act on your behalf. Use the link below to sign in to eBay and generate a token for your App ID.
                                </p>
                                <a 
                                    href={isSandbox ? "https://developer.ebay.com/my/auth?env=sandbox&index=0" : "https://developer.ebay.com/my/auth?env=production&index=0"} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm font-semibold text-indigo-600 hover:underline mt-2 inline-block"
                                >
                                    Get your {isSandbox ? 'Sandbox' : 'Production'} User Token &rarr;
                                </a>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="ebayAppId" className="block text-sm font-medium text-slate-700">App ID (Client ID)</label>
                            <input type="text" name="ebayAppId" id="ebayAppId" value={localKeys.ebayAppId} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="ebayUserToken" className="block text-sm font-medium text-slate-700">OAuth User Token</label>
                            <input type="password" name="ebayUserToken" id="ebayUserToken" value={localKeys.ebayUserToken} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={handleVerifyEbay} disabled={!localKeys.ebayAppId || !localKeys.ebayUserToken || verificationStatus.ebay === 'verifying'} className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                                {verificationStatus.ebay === 'verifying' && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {verificationStatus.ebay === 'success' && <CheckIcon className="h-4 w-4 mr-2 text-green-500"/>}
                                {verificationStatus.ebay === 'error' && <ErrorIcon className="h-4 w-4 mr-2 text-red-500"/>}
                                Verify
                            </button>
                        </div>
                    </fieldset>

                     <hr className="border-slate-200" />
                    
                    {/* Twitter Settings */}
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-slate-800">X (Twitter) API (Optional)</legend>
                        <div className="p-3 bg-slate-100 rounded-md text-sm text-slate-600 flex items-start space-x-2">
                            <InfoIcon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0"/>
                            <span>Enables the "Post to X" button. You will need Elevated access from the <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">Twitter Developer Portal</a>.</span>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="twitterApiKey" className="block text-sm font-medium text-slate-700">API Key</label>
                                <input type="password" name="twitterApiKey" id="twitterApiKey" value={localKeys.twitterApiKey} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="twitterApiSecret" className="block text-sm font-medium text-slate-700">API Key Secret</label>
                                <input type="password" name="twitterApiSecret" id="twitterApiSecret" value={localKeys.twitterApiSecret} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                            </div>
                             <div>
                                <label htmlFor="twitterAccessToken" className="block text-sm font-medium text-slate-700">Access Token</label>
                                <input type="password" name="twitterAccessToken" id="twitterAccessToken" value={localKeys.twitterAccessToken} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                            </div>
                             <div>
                                <label htmlFor="twitterAccessSecret" className="block text-sm font-medium text-slate-700">Access Token Secret</label>
                                <input type="password" name="twitterAccessSecret" id="twitterAccessSecret" value={localKeys.twitterAccessSecret} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"/>
                            </div>
                        </div>
                        <div className="flex justify-end">
                             <button type="button" onClick={handleVerifyTwitter} disabled={verificationStatus.twitter === 'verifying'} className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                                {verificationStatus.twitter === 'verifying' && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {verificationStatus.twitter === 'success' && <CheckIcon className="h-4 w-4 mr-2 text-green-500"/>}
                                {verificationStatus.twitter === 'error' && <ErrorIcon className="h-4 w-4 mr-2 text-red-500"/>}
                                Verify
                            </button>
                        </div>
                    </fieldset>
                </main>
                <footer className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                    <button onClick={onClose} type="button" className="mr-3 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSave} type="button" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">Save & Close</button>
                </footer>
            </div>
        </div>
    );
};


export default App;