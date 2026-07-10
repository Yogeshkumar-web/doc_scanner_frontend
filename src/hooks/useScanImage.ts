import { useMutation } from '@tanstack/react-query';
import { scanImageAsFile } from '../api/scanApi';
import { usePageStore } from '../store/usePageStore';
import { toast } from 'sonner';
import type { ScanMode } from '../types/api';

export function useScanImage() {
  const addPage = usePageStore((s) => s.addPage);

  return useMutation({
    mutationFn: async ({ file, mode }: { file: File; mode: ScanMode }) => {
      const { data, processedImageFile } = await scanImageAsFile(file, mode);
      const imageMimeType = data.image_mime_type || 'image/jpeg';
      return {
        data,
        imageMimeType,
        processedImageFile,
        processedImageUrl: URL.createObjectURL(processedImageFile),
        originalFile: file,
        originalObjectUrl: URL.createObjectURL(file),
        originalName: file.name,
        originalType: file.type || 'image/jpeg',
      };
    },
    onSuccess: ({ data, imageMimeType, processedImageFile, processedImageUrl, originalFile, originalObjectUrl, originalName, originalType }) => {
      addPage({
        id: crypto.randomUUID(),
        imageMimeType,
        processedImageFile,
        processedImageUrl,
        originalFile,
        originalObjectUrl,
        originalName,
        originalType,
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
        createdAt: Date.now(),
      });
      if ((data.crop_confidence ?? data.confidence) < 0.62) {
        toast.warning('Page scanned, but crop confidence is low. Review before exporting.');
      } else if (data.warnings.includes('SHADOW_REMAINS')) {
        toast.warning('Page scanned, but some shadow remains.');
      } else if (data.warnings.includes('IMAGE_BLURRY')) {
        toast.warning('Page scanned, but the photo looks blurry.');
      } else if (data.warnings.includes('GLARE_DETECTED')) {
        toast.warning('Page scanned, but glare may affect readability.');
      } else {
        toast.success('Page scanned successfully.');
      }
    },
    onError: (error) => {
      console.error('Scan error:', error);
      toast.error('Failed to process image. Please try again.');
    },
  });
}
