import React, { useState } from 'react';
import { ImagePreview } from './components/ImagePreview';
import { GeneratedListing } from './components/GeneratedListing';
import { UploadIcon, SparklesIcon } from './components/icons';
import { generateListing } from './services/geminiService';
import type { Listing } from './types';

const App: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Dummy config values, in a real app these would come from user settings
  const isEbayConfigured = true;
  const isTwitterConfigured = true;

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setImages(prev => [...prev, ...newFiles].slice(0, 4)); // Limit to 4 images
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
    setListing(null);

    try {
      const generatedData = await generateListing(images, notes);
      setListing(generatedData);
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
  
  const handleReset = () => {
    setImages([]);
    setNotes('');
    setListing(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center space-x-3">
          <SparklesIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">AI Listing Generator</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Input Form */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">1. Upload Your Product Images</h2>
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

              <div className="flex items-center space-x-4">
                 <button
                  type="submit"
                  disabled={isLoading || images.length === 0}
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Generating...' : 'Generate Listing'}
                  <SparklesIcon className={`ml-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                {(listing || error) && (
                   <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Right Column: Output */}
          <div className="bg-white p-8 rounded-xl shadow-lg relative min-h-[500px] flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 absolute top-8 left-8">2. Generated Listing</h2>
            <div className="mt-12">
              {isLoading && (
                <div className="flex flex-col items-center justify-center text-center text-slate-500">
                  <SparklesIcon className="h-12 w-12 text-indigo-500 animate-spin" />
                  <p className="mt-4 font-semibold">Generating your listing...</p>
                  <p className="text-sm mt-1">This may take a moment. The AI is crafting the perfect description.</p>
                </div>
              )}
              {error && (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Error</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}
              {listing && !isLoading && (
                <GeneratedListing 
                  listing={listing}
                  isEbayConfigured={isEbayConfigured}
                  isTwitterConfigured={isTwitterConfigured}
                />
              )}
              {!listing && !isLoading && !error && (
                 <div className="text-center text-slate-400">
                  <p>Your generated listing will appear here.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
