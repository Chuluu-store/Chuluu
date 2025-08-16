export interface Album {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  mediaCount: number;
  shareToken?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumCreate {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface AlbumUpdate {
  name?: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
}

export interface SharedAlbum extends Album {
  media: Array<{
    id: string;
    filename: string;
    type: "image" | "video";
    thumbnails: {
      small: string;
      medium: string;
      large: string;
    };
    createdAt: Date;
  }>;
}
