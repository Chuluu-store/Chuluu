export const APP_CONFIG = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  supportedFormats: {
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'],
    videos: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  },
  thumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  },
} as const;
