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
  // 파일 확장자 확인 (HEIC는 MIME 타입이 일정하지 않음)
  const extension = file.name.toLowerCase().split('.').pop();
  const allowedExtensions = [
    // 이미지 확장자
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'heic', 'heif',
    // 비디오 확장자
    'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', '3gp', 'm4v'
  ];
  
  // 확장자로 먼저 체크
  if (allowedExtensions.includes(extension || '')) {
    return true;
  }
  
  // MIME 타입으로도 체크
  const allowedTypes = [
    // 이미지 형식
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif',
    // 비디오 형식
    'video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 
    'video/mkv', 'video/wmv', 'video/flv', 'video/webm', 
    'video/3gp', 'video/m4v', 'video/x-msvideo', 'video/x-matroska'
  ];
  
  return file.type ? allowedTypes.includes(file.type.toLowerCase()) : false;
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