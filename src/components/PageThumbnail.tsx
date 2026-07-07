import React from 'react';
import type { PageItem } from '../types/api';

interface PageThumbnailProps {
  page: PageItem;
  index: number;
  total: number;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAdjustCrop: (page: PageItem) => void;
  onDragStart: (id: string) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page,
  index,
  total,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAdjustCrop,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}) => {
  const confidencePercent = Math.round((page.confidence || 0) * 100);
  const whitenessPercent = Math.round((page.backgroundWhiteness || 0) * 100);
  const shadowPercent = Math.round((page.shadowScore || 0) * 100);
  const blurPercent = Math.round((page.blurScore || 0) * 100);
  const isLowConfidence = page.edgeDetected && page.confidence < 0.62;
  const isFallbackCrop = !page.edgeDetected && page.cropMethod !== 'full_image_confirmed';
  const cropLabel = page.cropMethod === 'full_image_confirmed'
    ? 'Full image confirmed'
    : page.edgeDetected
      ? `Manual crop ${confidencePercent}%`
      : 'Full image fallback';

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', page.id);
        onDragStart(page.id);
      }}
      onDragOver={onDragOver}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(page.id);
      }}
      onDragEnd={onDragEnd}
      className={`group relative bg-white dark:bg-brand-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-45 ring-2 ring-brand-purple' : ''}`}
      title="Drag to reorder"
    >
      {/* Page number badge */}
      <span className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center justify-center backdrop-blur-sm">
        {index + 1}
      </span>

      {/* Delete button (shows on hover, but visible on touch devices via default opacity on small screens) */}
      <button
        onClick={() => onDelete(page.id)}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        title="Delete page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Image Preview Container */}
      <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <img
          src={`data:image/png;base64,${page.imageBase64}`}
          alt={`Page ${index + 1}`}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Fallback Warning Badge */}
        {isFallbackCrop && (
          <div className="absolute bottom-2 left-2 right-2 bg-amber-500/90 text-white text-[10px] py-1 px-2 rounded-lg flex items-center gap-1 font-semibold backdrop-blur-sm justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Full Image (No Auto-Crop)</span>
          </div>
        )}

        {isLowConfidence && (
          <div className="absolute bottom-2 left-2 right-2 bg-amber-500/90 text-white text-[10px] py-1 px-2 rounded-lg flex items-center gap-1 font-semibold backdrop-blur-sm justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Review Crop ({confidencePercent}%)</span>
          </div>
        )}
      </div>

      {/* Reordering Controls */}
      <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Document scan
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {cropLabel}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            White {whitenessPercent}% · Shadow {shadowPercent}%
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Blur {blurPercent}% · {page.selectedEnhancement || 'auto'}
          </div>
        </div>
        <div className="flex gap-1.5">
          <span
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500"
            title="Drag to reorder"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h.01M8 12h.01M8 17h.01M16 7h.01M16 12h.01M16 17h.01" />
            </svg>
          </span>
          {page.originalDataUrl && (
            <button
              onClick={() => onAdjustCrop(page)}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer"
              title="Adjust crop"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 2v14a2 2 0 002 2h14M18 22V8a2 2 0 00-2-2H2" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Move Page Up"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Move Page Down"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
