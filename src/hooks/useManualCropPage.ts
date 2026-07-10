import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { manualCropImage } from '../api/scanApi';
import { usePageStore } from '../store/usePageStore';
import type { CropPoint, PageItem } from '../types/api';
import { base64ToFile } from '../utils/imageData';

export function useManualCropPage() {
  const updatePage = usePageStore((state) => state.updatePage);

  return useMutation({
    mutationFn: async ({ page, points }: { page: PageItem; points: CropPoint[] }) => {
      if (!page.originalFile) {
        throw new Error('Original image is not available for this page.');
      }
      const data = await manualCropImage(page.originalFile, points, 'auto', page.selectedEnhancement);
      const imageMimeType = data.image_mime_type || 'image/jpeg';
      const processedImageFile = base64ToFile(data.image_base64, `${page.id}.jpg`, imageMimeType);
      return {
        page,
        data,
        imageMimeType,
        processedImageFile,
        processedImageUrl: URL.createObjectURL(processedImageFile),
      };
    },
    onSuccess: ({ page, data, imageMimeType, processedImageFile, processedImageUrl }) => {
      updatePage(page.id, {
        imageMimeType,
        processedImageFile,
        processedImageUrl,
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
