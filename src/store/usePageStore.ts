import { create } from 'zustand';
import type { PageItem } from '../types/api';

interface PageStore {
  pages: PageItem[];
  addPage: (page: PageItem) => void;
  updatePage: (id: string, patch: Partial<PageItem>) => void;
  removePage: (id: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  clearPages: () => void;
}

export const usePageStore = create<PageStore>((set) => ({
  pages: [],
  addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
  updatePage: (id, patch) => set((state) => ({
    pages: state.pages.map((page) => (page.id === id ? { ...page, ...patch } : page)),
  })),
  removePage: (id) => set((state) => ({ pages: state.pages.filter(p => p.id !== id) })),
  reorderPages: (fromIndex, toIndex) => set((state) => {
    if (fromIndex < 0 || fromIndex >= state.pages.length || toIndex < 0 || toIndex >= state.pages.length) {
      return state;
    }
    const updated = [...state.pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return { pages: updated };
  }),
  clearPages: () => set({ pages: [] }),
}));
