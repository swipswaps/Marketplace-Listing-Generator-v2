import React, { useState } from 'react';
import { CloseIcon, MaximizeIcon } from './icons';
import { ImageZoomModal } from './ImageZoomModal';

interface ImagePreviewProps {
  images: File[];
  onRemove: (index: number) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ images, onRemove }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (images.length === 0) {
    return null;
  }
  
  const handleZoom = (e: React.MouseEvent, file: File) => {
    e.stopPropagation();
    setZoomedImage(URL.createObjectURL(file));
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {images.map((file, index) => (
          <div key={index} className="relative aspect-square group">
            <img
              src={URL.createObjectURL(file)}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover rounded-lg shadow-md"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center space-x-2">
               <button
                type="button"
                onClick={(e) => handleZoom(e, file)}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white transition-opacity opacity-0 group-hover:opacity-100"
                aria-label={`Zoom image ${index + 1}`}
              >
                <MaximizeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white transition-opacity opacity-0 group-hover:opacity-100"
                aria-label={`Remove image ${index + 1}`}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {zoomedImage && (
        <ImageZoomModal 
            src={zoomedImage} 
            onClose={() => {
                URL.revokeObjectURL(zoomedImage);
                setZoomedImage(null)
            }} 
        />
      )}
    </>
  );
};
