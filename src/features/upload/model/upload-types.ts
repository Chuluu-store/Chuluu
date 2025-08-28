export interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  mediaId?: string;
  previewUrl?: string; // HEIC 파일의 경우 변환된 미리보기 URL
}

export interface UploadStats {
  total: number;
  completed: number;
  failed: number;
  totalSize: number;
  estimatedTime: number;
}

export interface BulkUploadProps {
  groupId: string;
  onUploadComplete?: (results: any) => void;
  onClose?: () => void;
}

export interface UploadSession {
  sessionId: string;
  estimatedTime: number;
}
