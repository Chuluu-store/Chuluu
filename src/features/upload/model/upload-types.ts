export interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  mediaId?: string;
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