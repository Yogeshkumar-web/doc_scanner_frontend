import { useMutation } from '@tanstack/react-query';
import { generatePdf } from '../api/pdfApi';
import { usePageStore } from '../store/usePageStore';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export function useGeneratePdf() {
  const pages = usePageStore((s) => s.pages);

  return useMutation({
    mutationFn: () => generatePdf(pages.map(p => p.imageBase64)),
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
