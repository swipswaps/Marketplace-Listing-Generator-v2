import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { nanoid } from 'nanoid';
import { ImagePreview } from './components/ImagePreview';
import { ListingHistory } from './components/ListingHistory';
import { VariationSelectionModal } from './components/VariationSelectionModal';
import { EditListingModal } from './components/EditListingModal';
import { EbayRefinementModal } from './components/EbayRefinementModal';
import { SparklesIcon, SettingsIcon, UploadIcon, CloseIcon, CheckIcon, ErrorIcon } from './components/icons';

import { generateListings, verifyGeminiKey } from './services/geminiService';
import { dbService } from './services/dbService';
import { postToListingFlow, verifyEbayCredentials } from './services/ebayService';
import { postToX, verifyTwitterCredentials } from './services/twitterService';
import type { Listing, ListingVariation, ApiKeys } from './types';


// --- Inlined Components to avoid creating new files ---

const ImageUploader: React.FC<{ onImageChange: (files: File[]) => void }> = ({ onImageChange }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onImageChange(Array.from(e.target.files));
            // Reset input to allow re-uploading the same file
            e.target.value = ''; 
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onImageChange(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
            e.dataTransfer.clearData();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div 
            className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload files</span>
                        <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG, GIF, WebP</p>
            </div>
        </div>
    );
};


type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';
interface StatusState {
    gemini: VerificationStatus;
    ebay: VerificationStatus;
    twitter: VerificationStatus;
}

interface SettingsModalProps {
    initialApiKeys: ApiKeys;
    onSave: (keys: ApiKeys) => void;
    onClose: () => void;
    verifyGeminiKey: (key: string) => Promise<{ success: boolean; error?: string }>;
    verifyEbayCredentials: (keys: Pick<ApiKeys, 'ebayUserToken' | 'ebayEnvironment'>) => Promise<boolean>;
    verifyTwitterCredentials: (keys: Pick<ApiKeys, 'twitterApiKey' | 'twitterApiSecret' | 'twitterAccessToken' | 'twitterAccessSecret'>) => Promise<boolean>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ initialApiKeys, onSave, onClose, verifyGeminiKey, verifyEbayCredentials, verifyTwitterCredentials }) => {
    const [keys, setKeys] = useState<ApiKeys>(initialApiKeys);
    const [status, setStatus] = useState<StatusState>({ gemini: 'idle', ebay: 'idle', twitter: 'idle' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleVerify = async (service: keyof StatusState) => {
        setStatus(prev => ({ ...prev, [service]: 'verifying' }));
        let success = false;
        if (service === 'gemini') {
            const result = await verifyGeminiKey(keys.geminiApiKey);
            success = result.success;
            if (!success) toast.error(result.error || "Gemini key verification failed.");
        } else if (service === 'ebay') {
            success = await verifyEbayCredentials({ ebayUserToken: keys.ebayUserToken, ebayEnvironment: keys.ebayEnvironment });
            if (!success) toast.error("eBay credential verification failed. Check your token and environment.");
        } else if (service === 'twitter') {
            success = await verifyTwitterCredentials({ twitterApiKey: keys.twitterApiKey, twitterApiSecret: keys.twitterApiSecret, twitterAccessToken: keys.twitterAccessToken, twitterAccessSecret: keys.twitterAccessSecret });
            if (!success) toast.error("Twitter credential verification failed. Ensure all four fields are filled.");
        }
        setStatus(prev => ({ ...prev, [service]: success ? 'success' : 'error' }));
    };
    
    const StatusIndicator: React.FC<{ status: VerificationStatus }> = ({ status }) => {
        if (status === 'verifying') return <span className="text-xs text-slate-500 animate-pulse">Verifying...</span>;
        if (status === 'success') return <CheckIcon className="h-5 w-5 text-green-500" />;
        if (status === 'error') return <ErrorIcon className="h-5 w-5 text-red-500" />;
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">API Key Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close settings"><CloseIcon className="h-6 w-6 text-slate-500" /></button>
                </header>
                <main className="p-6 overflow-y-auto space-y-6">
                    {/* Gemini */}
                    <fieldset className="space-y-2">
                        <legend className="text-lg font-semibold text-slate-700">Google Gemini</legend>
                        <div className="flex items-center space-x-2">
                            <input type="password" name="geminiApiKey" value={keys.geminiApiKey} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm flex-grow" placeholder="Enter your Gemini API Key"/>
                            <button type="button" onClick={() => handleVerify('gemini')} className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap">Verify Key</button>
                            <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={status.gemini} /></div>
                        </div>
                    </fieldset>
                    
                    {/* eBay */}
                    <fieldset className="space-y-2">
                         <legend className="text-lg font-semibold text-slate-700">eBay</legend>
                         <div className="flex items-center space-x-2">
                            <input type="password" name="ebayUserToken" value={keys.ebayUserToken} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm flex-grow" placeholder="Enter your OAuth User Access Token"/>
                            <select name="ebayEnvironment" value={keys.ebayEnvironment} onChange={handleChange} className="mt-1 rounded-md border-slate-300 shadow-sm">
                                <option value="production">Production</option>
                                <option value="sandbox">Sandbox</option>
                            </select>
                            <button type="button" onClick={() => handleVerify('ebay')} className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap">Verify Token</button>
                            <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={status.ebay} /></div>
                        </div>
                    </fieldset>

                    {/* Twitter */}
                    <fieldset className="space-y-2">
                        <legend className="text-lg font-semibold text-slate-700">X (Twitter)</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           <input type="password" name="twitterApiKey" value={keys.twitterApiKey} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm" placeholder="API Key"/>
                           <input type="password" name="twitterApiSecret" value={keys.twitterApiSecret} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm" placeholder="API Key Secret"/>
                           <input type="password" name="twitterAccessToken" value={keys.twitterAccessToken} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm" placeholder="Access Token"/>
                           <input type="password" name="twitterAccessSecret" value={keys.twitterAccessSecret} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm" placeholder="Access Token Secret"/>
                        </div>
                        <div className="flex justify-end items-center space-x-2 pt-2">
                            <button type="button" onClick={() => handleVerify('twitter')} className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap">Verify Keys</button>
                            <div className="w-5 h-5 flex items-center justify-center"><StatusIndicator status={status.twitter} /></div>
                        </div>
                    </fieldset>

                </main>
                <footer className="flex items-center justify-end p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg flex-shrink-0">
                    <button onClick={onClose} className="mr-3 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button onClick={() => onSave(keys)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">Save & Close</button>
                </footer>
            </div>
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    const [images, setImages] = useState<File[]>([]);
    const [userQuery, setUserQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedVariations, setGeneratedVariations] = useState<ListingVariation[] | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [editingListing, setEditingListing] = useState<Listing | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [refiningEbayListing, setRefiningEbayListing] = useState<Listing | null>(null);
    const [isPostingToEbay, setIsPostingToEbay] = useState(false);
    const [apiKeys, setApiKeys] = useState<ApiKeys>({
        geminiApiKey: '', ebayAppId: '', ebayUserToken: '', ebayEnvironment: 'production',
        twitterApiKey: '', twitterApiSecret: '', twitterAccessToken: '', twitterAccessSecret: ''
    });

    const isEbayConfigured = apiKeys.ebayUserToken.trim() !== '';
    const isTwitterConfigured = !!(apiKeys.twitterApiKey.trim() && apiKeys.twitterApiSecret.trim() && apiKeys.twitterAccessToken.trim() && apiKeys.twitterAccessSecret.trim());
    
    useEffect(() => {
        try {
            const storedKeys = localStorage.getItem('apiKeys');
            if (storedKeys) {
                setApiKeys(JSON.parse(storedKeys));
            } else {
                setIsSettingsOpen(true);
            }
        } catch (e) {
            console.error("Could not parse API keys from localStorage", e);
            localStorage.removeItem('apiKeys');
        }

        try {
            const storedListings = localStorage.getItem('listings');
            if (storedListings) {
                setListings(JSON.parse(storedListings));
            }
        } catch(e) {
            console.error("Could not parse listings from localStorage", e);
            localStorage.removeItem('listings');
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('listings', JSON.stringify(listings));
        } catch (e) {
            console.error("Failed to save listings to localStorage", e);
        }
    }, [listings]);

    const handleImageChange = (newImages: File[]) => {
        setImages(prev => [...prev, ...newImages]);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleGenerate = async () => {
        if (images.length === 0) {
            toast.error("Please upload at least one image.");
            return;
        }
        if (!apiKeys.geminiApiKey) {
            toast.error("Please configure your Gemini API key in the settings.");
            setIsSettingsOpen(true);
            return;
        }
        setIsLoading(true);
        const loadingToast = toast.loading("Generating listings... This may take a moment.");
        try {
            const variations = await generateListings(images, userQuery, apiKeys.geminiApiKey);
            setGeneratedVariations(variations);
        } catch (error: any) {
            toast.error(error.message || "An unknown error occurred while generating listings.");
            console.error(error);
        } finally {
            setIsLoading(false);
            toast.dismiss(loadingToast);
        }
    };

    const handleSelectVariation = async (variation: ListingVariation, selectedPrice: number) => {
        try {
            const imageKeys = await dbService.saveImages(images);
            const newListing: Listing = {
                ...variation,
                id: nanoid(),
                createdAt: new Date().toISOString(),
                images: imageKeys,
                selectedPrice,
            };
            setListings(prev => [newListing, ...prev]);
        } catch (error) {
            console.error("Failed to save images to DB", error);
            toast.error("Could not save listing due to an image storage error.");
        }
    };

    const handleDeleteListing = async (id: string) => {
        const listingToDelete = listings.find(l => l.id === id);
        if (listingToDelete) {
            await dbService.deleteImages(listingToDelete.images);
        }
        setListings(prev => prev.filter(l => l.id !== id));
        toast.success("Listing deleted.");
    };

    const handleSaveEditedListing = (updatedListing: Listing) => {
        setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
        setEditingListing(null);
        toast.success("Listing updated.");
    };

    const handleSaveKeys = (keys: ApiKeys) => {
        setApiKeys(keys);
        try {
            localStorage.setItem('apiKeys', JSON.stringify(keys));
            toast.success("Settings saved!");
            setIsSettingsOpen(false);
        } catch (e) {
            toast.error("Could not save settings to local storage.");
            console.error(e);
        }
    };
    
    const handlePostToEbay = (listing: Listing) => {
        setRefiningEbayListing(listing);
    };

    const handleFinalPostToEbay = async (listing: Listing) => {
        setIsPostingToEbay(true);
        try {
            await postToListingFlow(listing, apiKeys);
            toast.success("Redirecting to eBay to complete your listing...");
            setRefiningEbayListing(null);
        } catch (error: any) {
            toast.error(`Could not redirect to eBay: ${error.message}`);
        } finally {
            setIsPostingToEbay(false);
        }
    };
    
    const handlePostToTwitter = (listing: Listing) => {
        try {
            postToX(listing, apiKeys);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="bg-slate-100 min-h-screen font-sans">
                <header className="bg-white shadow-sm sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <SparklesIcon className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-slate-900">AI Marketplace Lister</h1>
                        </div>
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            aria-label="Settings"
                        >
                            <SettingsIcon className="h-6 w-6 text-slate-600" />
                        </button>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800">1. Upload Your Images</h2>
                                <p className="text-sm text-slate-500 mt-1">Add clear photos of the item you want to sell.</p>
                                <ImageUploader onImageChange={handleImageChange} />
                                <ImagePreview images={images} onRemove={handleRemoveImage} />
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold text-slate-800">2. Describe Your Item (Optional)</h2>
                                <p className="text-sm text-slate-500 mt-1">Add any specific details or keywords for the AI to focus on.</p>
                                <textarea
                                    value={userQuery}
                                    onChange={(e) => setUserQuery(e.target.value)}
                                    rows={3}
                                    className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md"
                                    placeholder="e.g., 'Vintage 1980s leather jacket, good condition, minor scuff on left sleeve.'"
                                />
                            </div>

                            <div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading || images.length === 0}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading ? 'Generating...' : 'Generate Listings'}
                                    <SparklesIcon className={`ml-2 -mr-1 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-10">
                            <ListingHistory 
                                listings={listings} 
                                onEdit={setEditingListing}
                                onDelete={handleDeleteListing}
                                onPostEbay={handlePostToEbay}
                                onPostTwitter={handlePostToTwitter}
                                isEbayConfigured={isEbayConfigured}
                                isTwitterConfigured={isTwitterConfigured}
                            />
                        </div>
                    </div>
                </main>
            </div>
            {generatedVariations && (
                <VariationSelectionModal
                    variations={generatedVariations}
                    onSelect={handleSelectVariation}
                    onClose={() => setGeneratedVariations(null)}
                />
            )}
            {editingListing && (
                <EditListingModal
                    listing={editingListing}
                    onSave={handleSaveEditedListing}
                    onClose={() => setEditingListing(null)}
                />
            )}
            {isSettingsOpen && (
                <SettingsModal
                    initialApiKeys={apiKeys}
                    onSave={handleSaveKeys}
                    onClose={() => setIsSettingsOpen(false)}
                    verifyGeminiKey={verifyGeminiKey}
                    verifyEbayCredentials={verifyEbayCredentials}
                    verifyTwitterCredentials={verifyTwitterCredentials}
                />
            )}
            {refiningEbayListing && (
                <EbayRefinementModal 
                    listing={refiningEbayListing}
                    onPost={handleFinalPostToEbay}
                    onClose={() => setRefiningEbayListing(null)}
                    isPosting={isPostingToEbay}
                    apiKeys={apiKeys}
                />
            )}
        </>
    );
};

export default App;
