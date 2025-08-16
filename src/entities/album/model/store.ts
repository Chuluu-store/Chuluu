import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Album } from "./types";

interface AlbumState {
  // Data
  albums: Album[];
  currentAlbum: Album | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  setAlbums: (albums: Album[]) => void;
  addAlbum: (album: Album) => void;
  updateAlbum: (id: string, updates: Partial<Album>) => void;
  removeAlbum: (id: string) => void;

  setCurrentAlbum: (album: Album | null) => void;

  // UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAlbumStore = create<AlbumState>()(
  devtools(
    (set) => ({
      // Initial state
      albums: [],
      currentAlbum: null,
      isLoading: false,
      error: null,

      // Album actions
      setAlbums: (albums) => set({ albums }),

      addAlbum: (album) =>
        set((state) => ({
          albums: [album, ...state.albums],
        })),

      updateAlbum: (id, updates) =>
        set((state) => ({
          albums: state.albums.map((album) =>
            album.id === id ? { ...album, ...updates } : album
          ),
          currentAlbum:
            state.currentAlbum?.id === id
              ? { ...state.currentAlbum, ...updates }
              : state.currentAlbum,
        })),

      removeAlbum: (id) =>
        set((state) => ({
          albums: state.albums.filter((album) => album.id !== id),
          currentAlbum:
            state.currentAlbum?.id === id ? null : state.currentAlbum,
        })),

      setCurrentAlbum: (album) => set({ currentAlbum: album }),

      // UI State actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    { name: "album-store" }
  )
);
