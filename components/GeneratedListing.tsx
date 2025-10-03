import React, { useState, useEffect, useMemo } from 'react';
import type { Listing } from '../types';
import { dbService } from '../services/dbService';
import { EditIcon, DeleteIcon, InfoIcon, LinkIcon } from './icons';
import { ImageZoomModal } from './ImageZoomModal';

// A placeholder for platform icons
const PlatformIcon: React.FC<{ platform: 'ebay' | 'twitter' }> = ({ platform }) => {
    const styles = 'h-5 w-5';
    if (platform === 'ebay') {
        return <svg className={styles} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>eBay</title><path d="M12.012 16.531c-1.313 0-2.422-.047-3.328-.14-1.031-.094-1.89-.282-2.578-.563-.688-.281-1.234-.64-1.64-1.078-.407-.437-.602-.937-.586-1.5 0-.61.234-1.156.703-1.64.469-.485 1.078-.813 1.828-1-.187-.375-.281-.797-.281-1.265 0-.61.195-1.148.586-1.61.39-.468.914-.82 1.57-1.054.657-.235 1.414-.36 2.274-.375.937 0 1.828.07 2.671.219.844.148 1.57.398 2.18.75.61.351 1.031.781 1.266 1.289.234.508.351 1.039.351 1.594 0 .562-.133 1.093-.398 1.593-.266.5-.64.899-1.125 1.188a3.39 3.39 0 0 1-1.547.531c-.516.078-1.031.117-1.547.117-.234 0-.523-.023-.867-.07-.344-.046-.672-.101-.985-.164-.312-.062-.578-.094-.796-.094-.422 0-.68.078-.774.234-.093.157-.14.352-.14.586 0 .281.078.492.235.633.156.14.406.218.75.218.359 0 .719-.07 1.078-.218.36-.149.68-.336.969-.563.21-.171.46-.257.75-.257.516 0 .93.196 1.242.586.313.391.469.875.469 1.453 0 .61-.195 1.14-.586 1.593-.39.453-.906.813-1.547 1.078-.64.266-1.422.43-2.343.5-.188.015-.492.023-.914.023zm.188-1.578c.328 0 .687-.008.968-.023.891-.07 1.61-.234 2.157-.492.546-.258.945-.602 1.195-1.031.25-.43.375-.922.375-1.47 0-.5-.14- المنتج.93-.422-1.281-.281-.352-.695-.531-1.242-.531-.344 0-.656.102-.937.305-.282.203-.586.437-.914.703-.328.265-.711.484-1.149.656-.437.172-.867.258-1.289.258-.562 0-1.031-.14-1.406-.421-.375-.282-.562-.68-.562-1.188 0-.422.14-.758.422-1.015.281-.258.648-.383 1.101-.383.219 0 .469.031.75.094.328.07.656.133.984.187s.633.086.914.086c.563 0 1.086-.062 1.57-.187.485-.125.883-.344 1.195-.657.313-.312.469-.71.469-1.195 0-.484-.148-.914-.445-1.289-.297-.375-.703-.64-1.219-.796-.515-.157-1.101-.235-1.757-.235-.688 0-1.305.094-1.852.281-.547.188-.992.485-1.336.89-.343.407-.515.899-.515 1.477 0 .515.148.968.445 1.359.297.39.711.664 1.242.828.391.109.813.164 1.266.164.172 0 .336-.016.492-.047.156-.031.289-.054.398-.07.157-.031.282-.047.375-.047.078-.016.148-.023.211-.023z"/></svg>;
    }
    if (platform === 'twitter') {
        return <svg className={styles} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>;
    }
    return null;
};

interface GeneratedListingProps {
  listing: Listing;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onPostEbay: (listing: Listing) => void;
  onPostTwitter: (listing: Listing) => void;
  isEbayConfigured: boolean;
  isTwitterConfigured: boolean;
}

export const GeneratedListing: React.FC<GeneratedListingProps> = ({ listing, onEdit, onDelete, onPostEbay, onPostTwitter, isEbayConfigured, isTwitterConfigured }) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchImages = async () => {
      const files = await dbService.getImages(listing.images);
      if (active) {
        const urls = files.filter((f): f is File => !!f).map(URL.createObjectURL);
        setImageUrls(urls);
      }
    };

    fetchImages();

    return () => {
      active = false;
      imageUrls.forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.images]);

  const postButtons = useMemo(() => {
    const buttons = [];
    if (isEbayConfigured && listing.ebay) {
        buttons.push(<button key="ebay" onClick={() => onPostEbay(listing)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2"><PlatformIcon platform="ebay" /><span>Post to eBay</span></button>);
    }
    if (isTwitterConfigured && listing.twitter) {
        buttons.push(<button key="twitter" onClick={() => onPostTwitter(listing)} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2"><PlatformIcon platform="twitter" /><span>Post to X</span></button>);
    }
    return buttons;
  }, [isEbayConfigured, isTwitterConfigured, listing, onPostEbay, onPostTwitter]);

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-xl flex flex-col">
        <div className="p-6 flex-grow">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{listing.title}</h3>
                <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                    <button onClick={() => onEdit(listing)} className="p-2 rounded-full hover:bg-slate-100" aria-label="Edit"><EditIcon className="h-5 w-5 text-slate-600"/></button>
                    <button onClick={() => onDelete(listing.id)} className="p-2 rounded-full hover:bg-slate-100" aria-label="Delete"><DeleteIcon className="h-5 w-5 text-red-500"/></button>
                </div>
            </div>
            <div className="flex items-center space-x-4 text-sm mb-4">
                <p className="font-bold text-indigo-600 text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(listing.selectedPrice)}</p>
                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full self-start">{listing.category}</span>
            </div>
          
            {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {imageUrls.slice(0, 3).map((url, index) => (
                        <div key={index} className="relative aspect-square group cursor-pointer" onClick={() => setZoomedImage(url)}>
                            <img src={url} alt={`Listing ${listing.id} image ${index + 1}`} className="w-full h-full object-cover rounded-md"/>
                            {index === 2 && imageUrls.length > 3 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-md">
                                    <span className="text-white text-lg font-bold">+{imageUrls.length - 3}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            <p className="text-sm text-slate-600 line-clamp-3 mb-4">{listing.description}</p>
            
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2">
                 <h5 className="font-semibold text-slate-700 flex items-center"><InfoIcon className="h-4 w-4 mr-2 text-slate-400"/>Pricing Rationale</h5>
                 <p className="text-slate-600 italic">{listing.priceSuggestion.justification}</p>
                 {listing.priceSuggestion.sources && listing.priceSuggestion.sources.length > 0 && (
                    <>
                        <h5 className="font-semibold text-slate-700 flex items-center pt-2"><LinkIcon className="h-4 w-4 mr-2 text-slate-400"/>Cited Sources</h5>
                        <ul className="space-y-1">
                            {listing.priceSuggestion.sources.map((source, i) => (
                                <li key={i}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all" title={source.url}>{source.title || "View Source"}</a></li>
                            ))}
                        </ul>
                    </>
                 )}
            </div>
        </div>
        
        {postButtons.length > 0 && (
            <div className="p-4 bg-slate-100 mt-auto">
                <div className="flex gap-3">
                    {postButtons}
                </div>
            </div>
        )}
      </div>

      {zoomedImage && (
        <ImageZoomModal 
            src={zoomedImage} 
            onClose={() => setZoomedImage(null)} 
        />
      )}
    </>
  );
};
