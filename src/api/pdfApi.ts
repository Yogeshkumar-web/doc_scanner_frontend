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
