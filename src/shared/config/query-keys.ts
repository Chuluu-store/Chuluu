export const QUERY_KEYS = {
  media: {
    all: ["media"] as const,
    list: (page?: number, limit?: number) =>
      [...QUERY_KEYS.media.all, "list", { page, limit }] as const,
    detail: (id: string) => [...QUERY_KEYS.media.all, "detail", id] as const,
  },
  albums: {
    all: ["albums"] as const,
    list: () => [...QUERY_KEYS.albums.all, "list"] as const,
    detail: (id: string) => [...QUERY_KEYS.albums.all, "detail", id] as const,
    media: (id: string) => [...QUERY_KEYS.albums.all, id, "media"] as const,
  },
  shared: {
    all: ["shared"] as const,
    album: (token: string) => [...QUERY_KEYS.shared.all, "album", token] as const,
  },
} as const;
