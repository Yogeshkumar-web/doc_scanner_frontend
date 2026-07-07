import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { manualCropImage } from '../api/scanApi';
import { usePageStore } from '../store/usePageStore';
import type { CropPoint, PageItem } from '../types/api';
import { dataUrlToFile } from '../utils/fileData';

export function useManualCropPage() {
  const updatePage = usePageStore((state) => state.updatePage);

  return useMutation({
    mutationFn: async ({ page, points }: { page: PageItem; points: CropPoint[] }) => {
      if (!page.originalDataUrl) {
        throw new Error('Original image is not available for this page.');
      }
      const file = dataUrlToFile(
        page.originalDataUrl,
        page.originalName || `${page.id}.jpg`,
        page.originalType || 'image/jpeg',
      );
      const data = await manualCropImage(file, points, 'auto');
      return { page, data };
    },
    onSuccess: ({ page, data }) => {
      updatePage(page.id, {
        imageBase64: data.image_base64,
        edgeDetected: data.edge_detected,
        confidence: data.crop_confidence ?? data.confidence,
        cropMethod: data.crop_method,
        backgroundWhiteness: data.background_whiteness,
        shadowScore: data.shadow_score,
        textContrast: data.text_contrast,
        blurScore: data.blur_score,
        glareScore: data.glare_score,
        selectedEnhancement: data.selected_enhancement,
        processingMode: data.processing_mode,
        warnings: data.warnings,
      });
      toast.success('Crop updated.');
    },
    onError: (error) => {
      console.error('Manual crop error:', error);
      toast.error('Failed to update crop. Please try again.');
    },
  });
}
