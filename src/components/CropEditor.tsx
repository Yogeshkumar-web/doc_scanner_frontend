import React from 'react';
import { useManualCropPage } from '../hooks/useManualCropPage';
import type { CropPoint, PageItem } from '../types/api';
import { CropModal } from './CropModal';

interface CropEditorProps {
  page: PageItem;
  onClose: () => void;
}

export const CropEditor: React.FC<CropEditorProps> = ({ page, onClose }) => {
  const { mutateAsync, isPending } = useManualCropPage();

  const handleApply = async (points: CropPoint[]) => {
    await mutateAsync({ page, points });
    onClose();
  };

  if (!page.originalDataUrl) {
    return null;
  }

  return (
    <CropModal
      imageDataUrl={page.originalDataUrl}
      title="Adjust crop"
      subtitle={`Page ${page.id.slice(0, 8)}`}
      isPending={isPending}
      onApplyCrop={handleApply}
      onClose={onClose}
    />
  );
};
