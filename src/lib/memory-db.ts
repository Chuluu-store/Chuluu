interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  thumbnail: string;
  metadata?: {
    width?: number;
    height?: number;
    dateTaken?: Date;
    camera?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  isVideo: boolean;
  uploadedAt: Date;
  albumId?: string;
}

interface Album {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  shareId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class MemoryDB {
  private media: MediaItem[] = [];
  private albums: Album[] = [];

  constructor() {
    // 샘플 데이터 초기화
    this.initSampleData();
  }

  private initSampleData() {
    // 샘플 미디어 데이터 추가
    const sampleImages = [
      {
        name: "Mongolia Sunset",
        path: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800",
      },
      {
        name: "Gobi Desert",
        path: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      },
      {
        name: "Mongolian Horse",
        path: "https://images.unsplash.com/photo-1559854036-2409f22a918a?w=800",
      },
      {
        name: "Ulaanbaatar",
        path: "https://images.unsplash.com/photo-1605210834049-019b1cf57dc4?w=800",
      },
      {
        name: "Nomadic Life",
        path: "https://images.unsplash.com/photo-1627896157734-4d7d4388f28b?w=800",
      },
      {
        name: "Eagle Hunter",
        path: "https://images.unsplash.com/photo-1583314530950-ae5083430d77?w=800",
      },
      {
        name: "Mongolian Ger",
        path: "https://images.unsplash.com/photo-1552356893-fc3f8e8c2256?w=800",
      },
      {
        name: "Steppe Landscape",
        path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
      },
      {
        name: "Traditional Festival",
        path: "https://images.unsplash.com/photo-1584967918940-a7d51b064268?w=800",
      },
    ];

    sampleImages.forEach((img, index) => {
      this.media.push({
        _id: `sample-${index + 1}`,
        filename: `sample-${index + 1}.jpg`,
        originalName: img.name,
        mimetype: "image/jpeg",
        size: Math.floor(Math.random() * 5000000) + 1000000,
        path: img.path,
        thumbnail: img.path + "&q=80&w=400",
        metadata: {
          width: 1920,
          height: 1080,
          dateTaken: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ),
        },
        isVideo: false,
        uploadedAt: new Date(),
      });
    });
  }

  async getMedia(page: number = 1, limit: number = 20) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedMedia = this.media.slice(start, end);

    return {
      media: paginatedMedia,
      pagination: {
        page,
        limit,
        total: this.media.length,
        pages: Math.ceil(this.media.length / limit),
      },
    };
  }

  async addMedia(mediaData: Omit<MediaItem, "_id" | "uploadedAt">) {
    const newMedia: MediaItem = {
      ...mediaData,
      _id: `media-${Date.now()}-${Math.random()}`,
      uploadedAt: new Date(),
    };
    this.media.unshift(newMedia);
    return newMedia;
  }

  async getAlbums() {
    return this.albums;
  }

  async createAlbum(albumData: Omit<Album, "_id" | "createdAt" | "updatedAt">) {
    const newAlbum: Album = {
      ...albumData,
      _id: `album-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.albums.push(newAlbum);
    return newAlbum;
  }
}

export const memoryDB = new MemoryDB();
