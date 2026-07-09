export type ScanMode = 'auto' | 'print' | 'color' | 'gray' | 'bw' | 'soft';

export interface ScanResponse {
  success: boolean;
  image_base64: string;
  image_mime_type?: string;
  width: number;
  height: number;
  edge_detected: boolean;
  confidence: number;
  crop_confidence: number;
  crop_method: string;
  background_whiteness: number;
  shadow_score: number;
  text_contrast: number;
  blur_score: number;
  glare_score: number;
  selected_enhancement: string;
  processing_mode: ScanMode;
  warnings: string[];
}

export interface CropPoint {
  x: number;
  y: number;
}

export interface ApiErrorResponse {
  success: boolean;
  error_code: string;
  message: string;
}

export interface PageItem {
  id: string;            // crypto.randomUUID()
  imageBase64: string;   // processed image from backend
  imageMimeType?: string;
  originalFile?: File;
  originalObjectUrl?: string;
  originalName?: string;
  originalType?: string;
  edgeDetected: boolean;
  confidence: number;
  cropMethod: string;
  backgroundWhiteness: number;
  shadowScore: number;
  textContrast: number;
  blurScore: number;
  glareScore: number;
  selectedEnhancement: string;
  processingMode: ScanMode;
  warnings: string[];
  createdAt: number;
}
