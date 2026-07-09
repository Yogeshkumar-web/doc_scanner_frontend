import { apiClient } from './client';

export async function generatePdf(base64Pages: string[]): Promise<Blob> {
  const { data } = await apiClient.post<Blob>('/api/v1/pdf/generate', {
    pages: base64Pages
  }, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return data;
}

export async function generatePdfFromFiles(files: File[]): Promise<Blob> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('pages', file);
  });

  const { data } = await apiClient.post<Blob>('/api/v1/pdf/generate-files', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}
