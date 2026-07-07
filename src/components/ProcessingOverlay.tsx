import React from 'react';

interface ProcessingOverlayProps {
  isVisible: boolean;
  message: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4 text-center">
        {/* Animated spinner */}
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-purple border-r-brand-pink animate-spin"></div>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          {message}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This may take a moment. Please don't close the browser window.
        </p>
      </div>
    </div>
  );
};
