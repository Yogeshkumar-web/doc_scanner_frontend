import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from './client';
import { scanImageAsFile } from './scanApi';

vi.mock('./client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const postMock = vi.mocked(apiClient.post);

function metadataHeader(metadata: Record<string, unknown>) {
  return btoa(JSON.stringify(metadata))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function makeScanResponse(base64 = btoa('jpeg-data')) {
  return {
    success: true,
    image_base64: base64,
    image_mime_type: 'image/jpeg',
    width: 100,
    height: 120,
    edge_detected: false,
    confidence: 1,
    crop_confidence: 1,
    crop_method: 'full_image_confirmed',
    background_whiteness: 0.9,
    shadow_score: 0.1,
    text_contrast: 0.7,
    blur_score: 0.1,
    glare_score: 0,
    selected_enhancement: 'clean_grayscale',
    processing_mode: 'auto' as const,
    warnings: [],
  };
}

describe('scanImageAsFile', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('uses the binary scan response when metadata is present', async () => {
    const metadata = makeScanResponse('');
    postMock.mockResolvedValueOnce({
      data: new Blob(['processed'], { type: 'image/jpeg' }),
      headers: {
        'x-scan-metadata': metadataHeader(metadata),
      },
    });

    const result = await scanImageAsFile(new File(['source'], 'scan.jpg', { type: 'image/jpeg' }));

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(result.data.crop_method).toBe('full_image_confirmed');
    expect(result.processedImageFile.type).toBe('image/jpeg');
  });

  it('falls back to the JSON scan response when binary metadata is unavailable', async () => {
    const fallback = makeScanResponse();
    postMock
      .mockResolvedValueOnce({
        data: new Blob(['processed'], { type: 'image/jpeg' }),
        headers: {},
      })
      .mockResolvedValueOnce({
        data: fallback,
      });

    const result = await scanImageAsFile(new File(['source'], 'scan.jpg', { type: 'image/jpeg' }));

    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0][0]).toContain('/api/v1/scan/full-image-file');
    expect(postMock.mock.calls[1][0]).toContain('/api/v1/scan/full-image');
    expect(result.data.image_base64).toBe(fallback.image_base64);
    expect(result.processedImageFile.type).toBe('image/jpeg');
  });

  it('retries transient scan failures before using the binary response', async () => {
    const metadata = makeScanResponse('');
    postMock
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({
        data: new Blob(['processed'], { type: 'image/jpeg' }),
        headers: {
          'x-scan-metadata': metadataHeader(metadata),
        },
      });

    const result = await scanImageAsFile(new File(['source'], 'scan.jpg', { type: 'image/jpeg' }));

    expect(postMock).toHaveBeenCalledTimes(2);
    expect(result.data.crop_method).toBe('full_image_confirmed');
  });

  it('does not retry validation errors before falling back', async () => {
    const fallback = makeScanResponse();
    postMock
      .mockRejectedValueOnce({ response: { status: 400 } })
      .mockResolvedValueOnce({
        data: fallback,
      });

    const result = await scanImageAsFile(new File(['source'], 'scan.jpg', { type: 'image/jpeg' }));

    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[1][0]).toContain('/api/v1/scan/full-image');
    expect(result.data.image_base64).toBe(fallback.image_base64);
  });
});
