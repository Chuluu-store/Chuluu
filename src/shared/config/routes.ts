export const ROUTES = {
  home: "/",
  album: (id: string) => `/album/${id}`,
  media: (id: string) => `/media/${id}`,
} as const;
