// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일 타입 검증
export const isValidFileType = (file: File): boolean => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'
  ];
  return allowedTypes.includes(file.type);
};

// 파일 크기 검증 (10GB)
export const isValidFileSize = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  return file.size <= maxSize;
};

// 고유 파일 ID 생성
export const generateFileId = (file: File): string => {
  return `${file.name}_${file.size}_${Date.now()}_${Math.random()}`;
};