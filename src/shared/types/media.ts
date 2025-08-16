export interface MediaMetadata {
  width?: number;
  height?: number;
  dateTaken?: Date;
  camera?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  thumbnail?: string;
  metadata?: MediaMetadata;
  isVideo: boolean;
  uploadedAt: Date;
  albumId?: string;
  groupId?: string;
  uploadedBy?: string;
}

export interface MediaResponse {
  media: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UploadResponse {
  success: boolean;
  files: MediaItem[];
  count: number;
}
