export const APP_CONFIG = {
  name: "Chuluu",
  description: "몽골 여행 추억을 공유하는 클라우드 서비스",
  maxFileSize: 100 * 1024 * 1024, // 100MB
  supportedFormats: {
    images: ["jpg", "jpeg", "png", "heic", "webp"],
    videos: ["mp4", "mov", "avi", "mkv"],
  },
  thumbnailSizes: {
    small: { width: 200, height: 200 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  },
} as const;

export const ROUTES = {
  home: "/",
  album: (id: string) => `/album/${id}`,
  share: (id: string) => `/share/${id}`,
  api: {
    media: "/api/media",
    upload: "/api/upload",
    albums: "/api/albums",
  },
} as const;

export const QUERY_KEYS = {
  media: ["media"] as const,
  albums: ["albums"] as const,
  album: (id: string) => ["album", id] as const,
  shared: (token: string) => ["shared", token] as const,
} as const;
