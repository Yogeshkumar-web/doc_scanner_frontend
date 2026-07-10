import { apiClient } from './client';
import type { CropPoint, ScanMode, ScanResponse } from '../types/api';

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

export async function scanImage(file: File, mode: ScanMode = 'auto'): Promise<ScanResponse> {
  const uploadFile = normalizeImageFile(file);
  const formData = new FormData();
  formData.append('image', uploadFile);
  
  const { data } = await apiClient.post<ScanResponse>(`/api/v1/scan/full-image?mode=${mode}`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data' 
    },
  });
  return data;
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
