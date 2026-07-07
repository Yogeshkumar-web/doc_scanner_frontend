import { describe, it, expect, beforeEach } from 'vitest';
import { usePageStore } from './usePageStore';
import type { PageItem, ScanMode } from '../types/api';

function makePage(overrides: Partial<PageItem> & { id: string; imageBase64: string; processingMode?: ScanMode }): PageItem {
  return {
    edgeDetected: true,
    confidence: 0.9,
    cropMethod: 'combined_contour',
    backgroundWhiteness: 0.9,
    shadowScore: 0.12,
    textContrast: 0.7,
    blurScore: 0.1,
    glareScore: 0,
    selectedEnhancement: 'gray',
    processingMode: 'auto',
    warnings: [],
    createdAt: 1000,
    ...overrides,
  };
}

describe('usePageStore', () => {
  beforeEach(() => {
    usePageStore.getState().clearPages();
  });

  it('should add a page successfully', () => {
    const page = makePage({
      id: '1',
      imageBase64: 'base64_data',
    });
    usePageStore.getState().addPage(page);
    expect(usePageStore.getState().pages).toHaveLength(1);
    expect(usePageStore.getState().pages[0]).toEqual(page);
  });

  it('should remove a page successfully', () => {
    const page1 = makePage({ id: '1', imageBase64: 'base64_data_1' });
    const page2 = makePage({ id: '2', imageBase64: 'base64_data_2', edgeDetected: false, confidence: 0, cropMethod: 'full_image', backgroundWhiteness: 0.7, shadowScore: 0.4, textContrast: 0.5, processingMode: 'bw', warnings: ['USED_FULL_IMAGE'], createdAt: 2000 });
    usePageStore.getState().addPage(page1);
    usePageStore.getState().addPage(page2);

    usePageStore.getState().removePage('1');
    expect(usePageStore.getState().pages).toHaveLength(1);
    expect(usePageStore.getState().pages[0].id).toBe('2');
  });

  it('should update a page successfully', () => {
    const page = makePage({ id: '1', imageBase64: 'base64_data' });
    usePageStore.getState().addPage(page);

    usePageStore.getState().updatePage('1', {
      imageBase64: 'updated_data',
      cropMethod: 'manual_corners',
      confidence: 1,
    });

    expect(usePageStore.getState().pages[0]).toMatchObject({
      id: '1',
      imageBase64: 'updated_data',
      cropMethod: 'manual_corners',
      confidence: 1,
    });
  });

  it('should reorder pages successfully', () => {
    const page1 = makePage({ id: '1', imageBase64: 'data1' });
    const page2 = makePage({ id: '2', imageBase64: 'data2', confidence: 0.88, backgroundWhiteness: 0.86, shadowScore: 0.18, textContrast: 0.65, processingMode: 'gray', createdAt: 2000 });
    const page3 = makePage({ id: '3', imageBase64: 'data3', confidence: 0.86, backgroundWhiteness: 0.78, shadowScore: 0.28, textContrast: 0.62, processingMode: 'color', createdAt: 3000 });
    
    usePageStore.getState().addPage(page1);
    usePageStore.getState().addPage(page2);
    usePageStore.getState().addPage(page3);

    // move page 1 (index 0) to index 2
    usePageStore.getState().reorderPages(0, 2);
    const pages = usePageStore.getState().pages;
    expect(pages[0].id).toBe('2');
    expect(pages[1].id).toBe('3');
    expect(pages[2].id).toBe('1');
  });
});
