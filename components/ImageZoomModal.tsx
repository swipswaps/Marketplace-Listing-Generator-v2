import React from 'react';
import { CloseIcon } from './icons';

interface ImageZoomModalProps {
  src: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ src, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <img 
          src={src} 
          alt="Zoomed preview" 
          className="object-contain w-full h-full max-h-[90vh] rounded-lg shadow-2xl"
        />
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 bg-white text-slate-800 rounded-full p-2 shadow-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close image zoom view"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
