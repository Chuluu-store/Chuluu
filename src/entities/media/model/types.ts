export interface MediaMetadata {
  width: number;
  height: number;
  duration?: number; // for videos
  exif?: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
  };
  dateTaken?: Date;
}

export interface MediaThumbnail {
  small: string;
  medium: string;
  large: string;
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  type: "image" | "video";
  metadata: MediaMetadata;
  thumbnails: MediaThumbnail;
  albumId?: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  error?: string;
  mediaId?: string;
}

export type MediaFilter = {
  type?: "image" | "video";
  albumId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
};

export type MediaSort = "newest" | "oldest" | "name" | "size";
