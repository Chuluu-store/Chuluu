import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { Media, MediaFilter, MediaSort, MediaUpload } from './types';

interface MediaState {
  // Data
  media: Media[];
  uploads: MediaUpload[];

  // UI State
  selectedMedia: Media[];
  filter: MediaFilter;
  sort: MediaSort;
  isLoading: boolean;
  error: string | null;

  // Actions
  setMedia: (media: Media[]) => void;
  addMedia: (media: Media) => void;
  removeMedia: (id: string) => void;
  updateMedia: (id: string, updates: Partial<Media>) => void;

  // Selection
  selectMedia: (media: Media) => void;
  deselectMedia: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Upload
  addUpload: (upload: MediaUpload) => void;
  updateUpload: (index: number, updates: Partial<MediaUpload>) => void;
  removeUpload: (index: number) => void;
  clearUploads: () => void;

  // Filter & Sort
  setFilter: (filter: Partial<MediaFilter>) => void;
  setSort: (sort: MediaSort) => void;
  clearFilter: () => void;

  // UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMediaStore = create<MediaState>()(
  devtools(
    (set, get) => ({
      // Initial state
      media: [],
      uploads: [],
      selectedMedia: [],
      filter: {},
      sort: 'newest',
      isLoading: false,
      error: null,

      // Media actions
      setMedia: (media) => set({ media }),

      addMedia: (newMedia) =>
        set((state) => ({
          media: [newMedia, ...state.media],
        })),

      removeMedia: (id) =>
        set((state) => ({
          media: state.media.filter((m) => m.id !== id),
          selectedMedia: state.selectedMedia.filter((m) => m.id !== id),
        })),

      updateMedia: (id, updates) =>
        set((state) => ({
          media: state.media.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      // Selection actions
      selectMedia: (media) =>
        set((state) => {
          const isSelected = state.selectedMedia.some((m) => m.id === media.id);
          if (isSelected) {
            return {
              selectedMedia: state.selectedMedia.filter((m) => m.id !== media.id),
            };
          }
          return {
            selectedMedia: [...state.selectedMedia, media],
          };
        }),

      deselectMedia: (id) =>
        set((state) => ({
          selectedMedia: state.selectedMedia.filter((m) => m.id !== id),
        })),

      clearSelection: () => set({ selectedMedia: [] }),

      selectAll: () =>
        set((state) => ({
          selectedMedia: [...state.media],
        })),

      // Upload actions
      addUpload: (upload) =>
        set((state) => ({
          uploads: [...state.uploads, upload],
        })),

      updateUpload: (index, updates) =>
        set((state) => ({
          uploads: state.uploads.map((upload, i) => (i === index ? { ...upload, ...updates } : upload)),
        })),

      removeUpload: (index) =>
        set((state) => ({
          uploads: state.uploads.filter((_, i) => i !== index),
        })),

      clearUploads: () => set({ uploads: [] }),

      // Filter & Sort actions
      setFilter: (newFilter) =>
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        })),

      setSort: (sort) => set({ sort }),

      clearFilter: () => set({ filter: {} }),

      // UI State actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    { name: 'media-store' }
  )
);
