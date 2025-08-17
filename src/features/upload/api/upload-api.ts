import { UploadSession } from '../model/upload-types';

// 업로드 세션 생성
export const createUploadSession = async (
  groupId: string, 
  files: File[]
): Promise<UploadSession> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('인증이 필요합니다');

  const fileData = files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  }));

  const response = await fetch('/api/upload/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      groupId,
      files: fileData
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '세션 생성 실패');
  }

  return response.json();
};

// 개별 파일 업로드
export const uploadFile = async (
  file: File,
  sessionId: string,
  fileIndex: number,
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<any> => {
  console.log('🌐 Starting file upload API call:', {
    fileName: file.name,
    fileSize: file.size,
    sessionId,
    fileIndex
  });

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No auth token found');
    throw new Error('인증이 필요합니다');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('sessionId', sessionId);
  formData.append('fileIndex', fileIndex.toString());

  console.log('📡 Making fetch request to /api/upload/file');

  const response = await fetch('/api/upload/file', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
    signal
  });

  console.log('📨 Upload response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Upload failed:', error);
    throw new Error(error.error || '파일 업로드 실패');
  }

  const result = await response.json();
  console.log('✅ Upload successful:', result);
  return result;
};