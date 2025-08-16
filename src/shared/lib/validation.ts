import { APP_CONFIG } from "../config";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > APP_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${
        APP_CONFIG.maxFileSize / 1024 / 1024
      }MB까지 업로드 가능합니다.`,
    };
  }

  // Check file format
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) {
    return {
      isValid: false,
      error: "파일 확장자를 확인할 수 없습니다.",
    };
  }

  const allSupportedFormats = [
    ...APP_CONFIG.supportedFormats.images,
    ...APP_CONFIG.supportedFormats.videos,
  ];

  if (!allSupportedFormats.includes(extension as any)) {
    return {
      isValid: false,
      error: `지원하지 않는 파일 형식입니다. 지원 형식: ${allSupportedFormats.join(
        ", "
      )}`,
    };
  }

  return { isValid: true };
}

export function validateAlbumName(name: string): ValidationResult {
  if (!name.trim()) {
    return {
      isValid: false,
      error: "앨범 이름을 입력해주세요.",
    };
  }

  if (name.length < 2) {
    return {
      isValid: false,
      error: "앨범 이름은 최소 2자 이상이어야 합니다.",
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      error: "앨범 이름은 50자를 초과할 수 없습니다.",
    };
  }

  return { isValid: true };
}

export function isImageFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension
    ? APP_CONFIG.supportedFormats.images.includes(extension as any)
    : false;
}

export function isVideoFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension
    ? APP_CONFIG.supportedFormats.videos.includes(extension as any)
    : false;
}
