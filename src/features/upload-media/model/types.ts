export interface UploadConfig {
  maxFileSize: number;
  acceptedTypes: string[];
  allowMultiple: boolean;
  albumId?: string;
}

export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  error?: string;
}

export interface UploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}
