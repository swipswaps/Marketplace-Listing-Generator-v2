import React from 'react';

export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" 
    />
  </svg>
);

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.5 21.75l-.398-1.188a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.188-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.188a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.188.398a2.25 2.25 0 00-1.423 1.423z" 
    />
  </svg>
);

export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M9.594 3.94c.09-.542.56-1.008 1.11-1.226.55-.218 1.19-.218 1.74 0 .55.218 1.02.684 1.11 1.226l.08 1.14.06.86.85.38c.63.28 1.17.75 1.54 1.28l.61.88.94-.3c.59-.19 1.24-.01 1.69.44.45.45.63 1.1.44 1.69l-.3.94.88.61c.53.37 1 .91 1.28 1.54l.38.85.86.06 1.14.08c.542.09 1.008.56 1.226 1.11.218.55.218 1.19 0 1.74-.218.55-.684 1.02-1.226 1.11l-1.14.08-.86.06-.38.85c-.28.63-.75 1.17-1.28 1.54l-.88.61.3.94c.19.59.01 1.24-.44 1.69-.45.45-1.1.63-1.69.44l-.94-.3-.61.88c-.37.53-.91 1-1.54 1.28l-.85.38-.06.86-.08 1.14c-.09.542-.56 1.008-1.11 1.226-.55-.218-1.19-.218-1.74 0-.55-.218-1.02-.684-1.11-1.226l-.08-1.14-.06-.86-.85-.38c-.63-.28-1.17-.75-1.54-1.28l-.61-.88-.94.3c-.59-.19-1.24-.01-1.69-.44-.45-.45-.63-1.1-.44-1.69l.3-.94-.88-.61c-.53-.37-1-.91-1.28-1.54l-.38-.85-.86-.06-1.14-.08c-.542-.09-1.008-.56-1.226-1.11-.218-.55-.218-1.19 0-1.74.218.55.684-1.02 1.226 1.11l1.14-.08.86-.06.38-.85c.28-.63.75-1.17 1.28-1.54l.88-.61-.3-.94c-.19-.59-.01-1.24.44-1.69.45-.45 1.1-.63 1.69-.44l.94.3.61-.88c.37-.53.91-1 1.54-1.28l.85-.38.06-.86.08-1.14zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" 
        />
    </svg>
);

export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2}
        stroke="currentColor" 
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2}
        stroke="currentColor" 
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
