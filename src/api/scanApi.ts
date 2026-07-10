import { apiClient } from './client';
import type { CropPoint, ScanMode, ScanResponse } from '../types/api';
import { base64ToFile } from '../utils/imageData';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ScanImageResult {
  data: ScanResponse;
  processedImageFile: File;
}

function normalizeImageFile(file: File): File {
  if (file.type === 'image/jpeg' || file.type === 'image/png') {
    return file;
  }

  const lowerName = file.name.toLowerCase();
  const fallbackType = lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return new File([file], file.name || `scan.${fallbackType === 'image/png' ? 'png' : 'jpg'}`, {
    type: fallbackType,
  });
}

function wait(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function shouldRetryScanRequest(error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (!status) {
    return true;
  }
  return status === 408 || status === 429 || status >= 500;
}

async function postScanWithRetry<T>(
  url: string,
  data: FormData,
  config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const retryDelaysMs = [300, 900];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      return await apiClient.post<T>(url, data, config);
    } catch (error) {
      lastError = error;
      if (attempt === retryDelaysMs.length || !shouldRetryScanRequest(error)) {
        throw error;
      }
      await wait(retryDelaysMs[attempt]);
    }
  }

  throw lastError;
}

export async function scanImage(file: File, mode: ScanMode = 'auto'): Promise<ScanResponse> {
  const uploadFile = normalizeImageFile(file);
  const formData = new FormData();
  formData.append('image', uploadFile);
  
  const { data } = await postScanWithRetry<ScanResponse>(`/api/v1/scan/full-image?mode=${mode}`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data' 
    },
  });
  return data;
}

function decodeMetadataHeader(headerValue: string): ScanResponse {
  const padding = '='.repeat((4 - (headerValue.length % 4)) % 4);
  const json = atob(`${headerValue}${padding}`.replace(/-/g, '+').replace(/_/g, '/'));
  return {
    ...JSON.parse(json),
    image_base64: '',
  };
}

export async function scanImageAsFile(file: File, mode: ScanMode = 'auto'): Promise<ScanImageResult> {
  const uploadFile = normalizeImageFile(file);
  const formData = new FormData();
  formData.append('image', uploadFile);

  try {
    const response = await postScanWithRetry<Blob>(`/api/v1/scan/full-image-file?mode=${mode}`, formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const metadataHeader = response.headers['x-scan-metadata'];
    if (!metadataHeader || Array.isArray(metadataHeader)) {
      throw new Error('Scan metadata header is missing.');
    }

    const data = decodeMetadataHeader(metadataHeader);
    const imageMimeType = data.image_mime_type || response.data.type || 'image/jpeg';
    const processedImageFile = new File([response.data], `${crypto.randomUUID()}.jpg`, {
      type: imageMimeType,
      lastModified: Date.now(),
    });

    return { data, processedImageFile };
  } catch (error) {
    console.warn('Binary scan response failed, falling back to JSON scan response:', error);
    const data = await scanImage(uploadFile, mode);
    const imageMimeType = data.image_mime_type || 'image/jpeg';
    return {
      data,
      processedImageFile: base64ToFile(data.image_base64, `${crypto.randomUUID()}.jpg`, imageMimeType),
    };
  }
}

export async function manualCropImage(
  file: File,
  points: CropPoint[],
  mode: ScanMode = 'auto',
  selectedEnhancement?: string,
): Promise<ScanResponse> {
  const uploadFile = normalizeImageFile(file);
  const formData = new FormData();
  formData.append('image', uploadFile);
  formData.append('points_json', JSON.stringify(points));
  if (selectedEnhancement) {
    formData.append('selected_enhancement', selectedEnhancement);
  }

  const { data } = await apiClient.post<ScanResponse>(`/api/v1/scan/manual-crop?mode=${mode}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}
