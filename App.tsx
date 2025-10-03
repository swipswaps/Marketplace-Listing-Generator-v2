import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Listing } from './types';
import { generateListing, verifyGeminiApiKey } from './services/geminiService';
import { postToEbay } from './services/ebayService';
import { postToX } from './services/twitterService';
import { dbService } from './services/dbService';
import { ImagePreview } from './components/ImagePreview';
import { VariationSelectionModal } from './components/VariationSelectionModal';
import { ListingHistory } from './components/ListingHistory';
import { EditListingModal } from './components/EditListingModal';
import { UploadIcon, SparklesIcon, SettingsIcon, CheckIcon, ErrorIcon } from './components/icons';
import { Toaster, toast } from 'react-hot-toast';

// A simple settings modal for platform toggles
const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isEbayConfigured: boolean;
  setIsEbayConfigured: (v: boolean) => void;
  isTwitterConfigured: boolean;
  setIsTwitterConfigured: (v: boolean) => void;
}> = ({ isOpen, onClose, isEbayConfigured, setIsEbayConfigured, isTwitterConfigured, setIsTwitterConfigured }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input type="checkbox" checked={isEbayConfigured} onChange={(e) => setIsEbayConfigured(e.target.checked)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
            <span>Generate content for eBay</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" checked={isTwitterConfigured} onChange={(e) => setIsTwitterConfigured(e.target.checked)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
            <span>Generate content for X (Twitter)</span>
          </label>
        </div>
        <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Done</button>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiVerified, setGeminiVerified] = useState<boolean | null>(null);

  const [generatedVariations, setGeneratedVariations] = useState<Omit<Listing, 'id' | 'createdAt' | 'images'>[]>([]);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEbayConfigured, setIsEbayConfigured] = useState(true);
  const [isTwitterConfigured, setIsTwitterConfigured] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved data from localStorage on initial render
  useEffect(() => {
    try {
      const savedListings = localStorage.getItem('listings');
      if (savedListings) {
        setListings(JSON.parse(savedListings));
      }
      const savedEbay = localStorage.getItem('isEbayConfigured');
      if (savedEbay) {
        setIsEbayConfigured(JSON.parse(savedEbay));
      }
      const savedTwitter = localStorage.getItem('isTwitterConfigured');
      if (savedTwitter) {
        setIsTwitterConfigured(JSON.parse(savedTwitter));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast.error("Could not load saved data.");
    }
  }, []);
  
  // Verify Gemini API key status on mount
  useEffect(() => {
    verifyGeminiApiKey().then(isValid => {
      setGeminiVerified(isValid);
    });
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('listings', JSON.stringify(listings));
      localStorage.setItem('isEbayConfigured', JSON.stringify(isEbayConfigured));
      localStorage.setItem('isTwitterConfigured', JSON.stringify(isTwitterConfigured));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
      toast.error("Could not save changes.");
    }
  }, [listings, isEbayConfigured, isTwitterConfigured]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles].slice(0, 10)); // Limit to 10 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateClick = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }
    if (!geminiVerified) {
      toast.error('Gemini API key is not valid or missing from environment variables.');
      return;
    }
    setIsLoading(true);
    toast.loading('Generating listings... this may take a moment.');
    try {
      const variations = await generateListing(images, notes, isEbayConfigured, isTwitterConfigured);
      setGeneratedVariations(variations);
      setIsVariationModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  const handleSelectVariation = useCallback(async (variation: Omit<Listing, 'id' | 'createdAt' | 'images'>, selectedPrice: number) => {
    try {
        const imageKeys = await dbService.saveImages(images);
        const newListing: Listing = {
            ...variation,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            images: imageKeys,
            selectedPrice,
        };
        setListings(prev => [newListing, ...prev]);
        toast.success('Listing added to history!');
    } catch (error) {
        console.error("Failed to save listing:", error);
        toast.error("Could not save the listing.");
    }
  }, [images]);

  const handleUpdateListing = (updatedListing: Listing) => {
    setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
    setEditingListing(null);
    toast.success('Listing updated!');
  };

  const handleDeleteListing = async (id: string) => {
    const listingToDelete = listings.find(l => l.id === id);
    if (listingToDelete) {
        await dbService.deleteImages(listingToDelete.images);
    }
    setListings(prev => prev.filter(l => l.id !== id));
    toast.success('Listing deleted.');
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {isVariationModalOpen && (
        <VariationSelectionModal
          variations={generatedVariations}
          onSelect={handleSelectVariation}
          onClose={() => {
            setIsVariationModalOpen(false);
            // Reset form for next use
            setImages([]);
            setNotes('');
          }}
        />
      )}
      {editingListing && (
        <EditListingModal 
          listing={editingListing}
          onSave={handleUpdateListing}
          onClose={() => setEditingListing(null)}
        />
      )}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isEbayConfigured={isEbayConfigured}
        setIsEbayConfigured={setIsEbayConfigured}
        isTwitterConfigured={isTwitterConfigured}
        setIsTwitterConfigured={setIsTwitterConfigured}
      />

      <div className="min-h-screen bg-slate-50 text-slate-800">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900">AI Listing Generator</h1>
            <div className='flex items-center space-x-4'>
                {geminiVerified === true && <div className="flex items-center space-x-2 text-green-600"><CheckIcon className="h-5 w-5" /><span className='text-sm font-medium'>Gemini Ready</span></div>}
                {geminiVerified === false && <div className="flex items-center space-x-2 text-red-600"><ErrorIcon className="h-5 w-5" /><span className='text-sm font-medium'>Gemini Error</span></div>}
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-slate-200" aria-label="Settings">
                    <SettingsIcon className="h-6 w-6 text-slate-600"/>
                </button>
            </div>
          </header>

          <main className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left side - Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="text-lg font-semibold text-slate-700 mb-2 block">1. Upload Images</label>
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="h-12 w-12 mx-auto text-slate-400"/>
                    <p className="mt-2 text-slate-600">Drag & drop files here, or click to select files</p>
                    <p className="text-xs text-slate-500">Up to 10 images. PNG, JPG, WEBP accepted.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  <ImagePreview images={images} onRemove={removeImage} />
                </div>

                <div>
                  <label htmlFor="notes" className="text-lg font-semibold text-slate-700 mb-2 block">2. Add Notes</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="e.g., 'Small scratch on the back corner', 'Comes with original box and charger', 'Model A1989'"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Right side - Action */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-8 rounded-xl">
                 <h2 className="text-xl font-bold text-center text-slate-800">Ready to Sell?</h2>
                 <p className="text-slate-600 text-center mt-2 mb-6">Let AI craft the perfect listing for you based on real market data.</p>
                <button
                  onClick={handleGenerateClick}
                  disabled={isLoading || images.length === 0}
                  className="w-full max-w-xs flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                >
                  <SparklesIcon className="h-6 w-6 mr-3"/>
                  {isLoading ? 'Generating...' : 'Generate 3 Listings'}
                </button>
              </div>
            </div>
          </main>

          <section className="mt-12">
            <ListingHistory 
              listings={listings} 
              onEdit={setEditingListing}
              onDelete={handleDeleteListing}
              onPostEbay={(listing) => postToEbay(listing)}
              onPostTwitter={(listing) => postToX(listing, {})} // Assuming no client-side keys for twitter
              isEbayConfigured={isEbayConfigured}
              isTwitterConfigured={isTwitterConfigured}
            />
          </section>

        </div>
      </div>
    </>
  );
};

export default App;
