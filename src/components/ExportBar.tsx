import React from 'react';
import { usePageStore } from '../store/usePageStore';

interface ExportBarProps {
  onExport: () => void;
  isExportPending: boolean;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  onExport,
  isExportPending,
}) => {
  const { pages, clearPages } = usePageStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl px-4 py-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Pages count & Clear option */}
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-350">
            Total Pages: <span className="font-bold text-slate-900 dark:text-slate-100">{pages.length}</span>
          </div>
          {pages.length > 0 && (
            <button
              onClick={clearPages}
              type="button"
              className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Export trigger */}
        <button
          onClick={onExport}
          disabled={pages.length === 0 || isExportPending}
          className="w-full md:w-auto relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Compile & Download PDF</span>
        </button>
      </div>
    </div>
  );
};
