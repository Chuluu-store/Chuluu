export interface Album {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  coverImage?: string;
  shareId?: string;
  isPublic: boolean;
  mediaCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumDocument {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  shareId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
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
