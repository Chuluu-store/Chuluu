import { Album, AlbumDocument } from "../types/album";

export function transformAlbumDocument(doc: AlbumDocument): Album {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    coverImage: doc.coverImage,
    shareId: doc.shareId,
    isPublic: doc.isPublic,
    mediaCount: 0, // Will be populated by aggregation
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function transformAlbumDocuments(docs: AlbumDocument[]): Album[] {
  return docs.map(transformAlbumDocument);
}
