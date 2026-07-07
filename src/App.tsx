import { useState } from 'react';
import { CaptureScreen } from './components/CaptureScreen';
import { UploadDropzone } from './components/UploadDropzone';
import { PageGallery } from './components/PageGallery';
import { ExportBar } from './components/ExportBar';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { CropModal } from './components/CropModal';
import { useScanImage } from './hooks/useScanImage';
import { useGeneratePdf } from './hooks/useGeneratePdf';
import { compressImage } from './utils/compressImage';
import { toast } from 'sonner';
import { manualCropImage } from './api/scanApi';
import type { CropPoint, ScanResponse } from './types/api';
import { fileToDataUrl } from './utils/fileData';
import { usePageStore } from './store/usePageStore';

interface PendingCapture {
  file: File;
  dataUrl: string;
  queue: File[];
}

function App() {
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);

  const { mutateAsync: scanMutateAsync, isPending: isScanPending } = useScanImage();
  const { mutate: pdfMutate, isPending: isPdfPending } = useGeneratePdf();
  const addPage = usePageStore((state) => state.addPage);

  const addScanResult = (
    data: ScanResponse,
    originalDataUrl: string,
    originalName: string,
    originalType: string,
  ) => {
    addPage({
      id: crypto.randomUUID(),
      imageBase64: data.image_base64,
      imageMimeType: data.image_mime_type || 'image/jpeg',
      originalDataUrl,
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
  };

  const openCaptureModal = async (files: File[]) => {
    const [file, ...queue] = files;
    if (!file) {
      setPendingCapture(null);
      return;
    }
    setPendingCapture({
      file,
      dataUrl: await fileToDataUrl(file),
      queue,
    });
  };

  const continueCaptureQueue = async (queue: File[]) => {
    await openCaptureModal(queue);
  };

  const handleFilesSelected = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type === 'image/jpeg' || file.type === 'image/png');
    if (imageFiles.length === 0) {
      toast.error('Please select JPEG or PNG images.');
      return;
    }

    if (imageFiles.length !== files.length) {
      toast.warning('Some files were skipped because only JPEG and PNG are supported.');
    }

    try {
      for (const [index, file] of imageFiles.entries()) {
        const position = `${index + 1}/${imageFiles.length}`;
        setLoadingMessage(`Compressing image ${position}...`);
        const compressedFile = await compressImage(file);

        setLoadingMessage(`Enhancing image ${position}...`);
        await scanMutateAsync({ file: compressedFile, mode: 'auto' });
      }

      if (imageFiles.length > 1) {
        toast.success(`${imageFiles.length} pages added.`);
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while preparing images.');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleCaptureFilesSelected = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type === 'image/jpeg' || file.type === 'image/png');
    if (imageFiles.length === 0) {
      toast.error('Please capture a JPEG or PNG image.');
      return;
    }
    await openCaptureModal(imageFiles);
  };

  const handleAcceptCaptureFull = async () => {
    if (!pendingCapture) {
      return;
    }
    const { file, queue } = pendingCapture;
    try {
      setLoadingMessage('Enhancing image...');
      const compressedFile = await compressImage(file);
      await scanMutateAsync({ file: compressedFile, mode: 'auto' });
      setPendingCapture(null);
      await continueCaptureQueue(queue);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process captured image.');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleApplyCaptureCrop = async (points: CropPoint[]) => {
    if (!pendingCapture) {
      return;
    }
    const { file, dataUrl, queue } = pendingCapture;
    try {
      setLoadingMessage('Cropping & enhancing image...');
      const compressedFile = await compressImage(file);
      const data = await manualCropImage(compressedFile, points, 'auto');
      addScanResult(data, dataUrl, compressedFile.name, compressedFile.type || file.type || 'image/jpeg');
      toast.success('Page scanned successfully.');
      setPendingCapture(null);
      await continueCaptureQueue(queue);
    } catch (error) {
      console.error(error);
      toast.error('Failed to crop captured image.');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleExportPdf = () => {
    setLoadingMessage('Compiling PDF document...');
    pdfMutate(undefined, {
      onSettled: () => {
        setLoadingMessage(null);
      },
    });
  };

  const isOverlayVisible = isScanPending || isPdfPending || loadingMessage !== null;
  const currentMessage = loadingMessage || (isScanPending ? 'Processing scan...' : 'Generating PDF...');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-36 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white shadow-md shadow-brand-purple/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white m-0 leading-none">
                Antigravity Scan
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Edge-Detection PDF Scanner
              </span>
            </div>
          </div>
          
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/50">
            Prototype v1.0
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Onboarding & Input Panel */}
        <section className="grid md:grid-cols-5 gap-8 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Create clean PDFs in seconds
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Capture physical documents using your device's camera. Review each photo, crop only when needed, and export clean PDF pages.
            </p>
            <div className="pt-2">
              <CaptureScreen
                onFilesSelected={handleCaptureFilesSelected}
                isPending={isOverlayVisible}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700 font-bold text-xs">
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 mb-2"></div>
            OR
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 mt-2"></div>
          </div>

          <div className="md:col-span-2">
            <UploadDropzone
              onFilesSelected={handleFilesSelected}
              isPending={isOverlayVisible}
            />
          </div>
        </section>

        {/* Gallery */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <PageGallery />
        </section>
      </main>

      {/* Floating Export Footer */}
      <ExportBar
        onExport={handleExportPdf}
        isExportPending={isPdfPending}
      />

      {/* Global Processing Loader */}
      <ProcessingOverlay
        isVisible={isOverlayVisible}
        message={currentMessage}
      />

      {pendingCapture && (
        <CropModal
          imageDataUrl={pendingCapture.dataUrl}
          title="Review captured page"
          subtitle="Use OK for full image or adjust handles to crop."
          isPending={isOverlayVisible}
          fullImageLabel="OK"
          applyLabel="Apply crop"
          onAcceptFull={handleAcceptCaptureFull}
          onApplyCrop={handleApplyCaptureCrop}
          onClose={() => setPendingCapture(null)}
        />
      )}
    </div>
  );
}

export default App;
