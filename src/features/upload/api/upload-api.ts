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

// 개별 파일 업로드 (Direct Upload API 사용)
export const uploadFile = async (
  file: File,
  groupId: string,
  fileIndex: number,
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<any> => {
  console.log('🌐 Starting file upload API call:', {
    fileName: file.name,
    fileSize: file.size,
    groupId,
    fileIndex
  });

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No auth token found');
    throw new Error('인증이 필요합니다');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('groupId', groupId);

  console.log('📡 Making fetch request to /api/upload/direct');

  // XMLHttpRequest를 사용하여 진행률 추적
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          console.log('✅ Upload successful:', result);
          resolve(result);
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          reject(new Error('응답 파싱 실패'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          console.error('❌ Upload failed:', error);
          reject(new Error(error.error || '파일 업로드 실패'));
        } catch {
          reject(new Error(`업로드 실패: ${xhr.statusText}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      console.error('❌ Network error during upload');
      reject(new Error('네트워크 오류'));
    });

    xhr.addEventListener('abort', () => {
      console.log('⚠️ Upload aborted');
      reject(new Error('업로드 취소됨'));
    });

    // 취소 신호 처리
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    xhr.open('POST', '/api/upload/direct');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};