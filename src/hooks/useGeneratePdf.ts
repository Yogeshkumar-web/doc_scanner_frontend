import { useMutation } from '@tanstack/react-query';
import { generatePdf, generatePdfFromFiles } from '../api/pdfApi';
import { usePageStore } from '../store/usePageStore';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export function useGeneratePdf() {
  const pages = usePageStore((s) => s.pages);

  return useMutation({
    mutationFn: () => {
      const processedFiles = pages.map((page) => page.processedImageFile);
      if (processedFiles.every(Boolean)) {
        return generatePdfFromFiles(processedFiles as File[]);
      }
      return generatePdf(pages.map((page) => page.imageBase64 || ''));
    },
    onSuccess: (blob) => {
      saveAs(blob, 'scanned_document.pdf');
      toast.success('PDF generated and downloaded successfully.');
    },
    onError: (error) => {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF.');
    },
  });
}
