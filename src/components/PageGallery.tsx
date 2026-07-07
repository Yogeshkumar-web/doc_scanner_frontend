import React from 'react';
import { usePageStore } from '../store/usePageStore';
import { PageThumbnail } from './PageThumbnail';
import { CropEditor } from './CropEditor';
import type { PageItem } from '../types/api';

export const PageGallery: React.FC = () => {
  const { pages, removePage, reorderPages } = usePageStore();
  const [cropPage, setCropPage] = React.useState<PageItem | null>(null);
  const [draggingPageId, setDraggingPageId] = React.useState<string | null>(null);

  const handleMoveUp = (index: number) => {
    reorderPages(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    reorderPages(index, index + 1);
  };

  const handleDrop = (targetPageId: string) => {
    if (!draggingPageId || draggingPageId === targetPageId) {
      setDraggingPageId(null);
      return;
    }

    const fromIndex = pages.findIndex((page) => page.id === draggingPageId);
    const toIndex = pages.findIndex((page) => page.id === targetPageId);
    if (fromIndex >= 0 && toIndex >= 0) {
      reorderPages(fromIndex, toIndex);
    }
    setDraggingPageId(null);
  };

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 py-20 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 backdrop-blur-sm">
        <div className="w-24 h-24 mb-6 rounded-full bg-brand-purple/5 flex items-center justify-center text-brand-purple/40">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No pages captured yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center">
          Capture or upload your document pages to start building your PDF.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>Captured Pages</span>
          <span className="px-2.5 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple text-xs font-semibold">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </span>
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            index={index}
            total={pages.length}
            onDelete={removePage}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onAdjustCrop={setCropPage}
            onDragStart={setDraggingPageId}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={handleDrop}
            onDragEnd={() => setDraggingPageId(null)}
            isDragging={draggingPageId === page.id}
          />
        ))}
      </div>
      {cropPage && (
        <CropEditor
          page={cropPage}
          onClose={() => setCropPage(null)}
        />
      )}
    </div>
  );
};
