import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { UploadProgress } from "./types";

interface UploadState {
  // Data
  uploads: UploadProgress[];
  isUploading: boolean;

  // Actions
  addUpload: (upload: UploadProgress) => void;
  updateUpload: (fileId: string, updates: Partial<UploadProgress>) => void;
  removeUpload: (fileId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;

  setUploading: (uploading: boolean) => void;
}

export const useUploadStore = create<UploadState>()(
  devtools(
    (set) => ({
      // Initial state
      uploads: [],
      isUploading: false,

      // Actions
      addUpload: (upload) =>
        set((state) => ({
          uploads: [...state.uploads, upload],
        })),

      updateUpload: (fileId, updates) =>
        set((state) => ({
          uploads: state.uploads.map((upload) =>
            upload.fileId === fileId ? { ...upload, ...updates } : upload
          ),
        })),

      removeUpload: (fileId) =>
        set((state) => ({
          uploads: state.uploads.filter((upload) => upload.fileId !== fileId),
        })),

      clearCompleted: () =>
        set((state) => ({
          uploads: state.uploads.filter(
            (upload) =>
              upload.status !== "completed" && upload.status !== "error"
          ),
        })),

      clearAll: () => set({ uploads: [] }),

      setUploading: (isUploading) => set({ isUploading }),
    }),
    { name: "upload-store" }
  )
);
