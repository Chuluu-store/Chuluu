'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  thumbnail: string;
  isVideo: boolean;
  uploadedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    dateTaken?: string;
  };
}

export default function MediaGrid() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, [page]);

  const fetchMedia = async () => {
    try {
      const response = await fetch(`/api/media?page=${page}&limit=20`);
      const data = await response.json();
      
      if (page === 1) {
        setMedia(data.media);
      } else {
        setMedia(prev => [...prev, ...data.media]);
      }
      
      setHasMore(page < data.pagination.pages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching media:', error);
      setLoading(false);
    }
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
  };

  const closeModal = () => {
    setSelectedMedia(null);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
        {media.map((item) => (
          <div
            key={item._id}
            className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100 rounded-lg"
            onClick={() => handleMediaClick(item)}
          >
            {item.isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  src={item.path}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <Image
                src={item.thumbnail || item.path}
                alt={item.originalName}
                fill
                className="object-cover transition-transform duration-200 hover:scale-105"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
              />
            )}
          </div>
        ))}
      </div>

      {loading && page === 1 && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-50"
            onClick={closeModal}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.isVideo ? (
              <video
                src={selectedMedia.path}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : (
              <Image
                src={selectedMedia.path}
                alt={selectedMedia.originalName}
                width={selectedMedia.metadata?.width || 1920}
                height={selectedMedia.metadata?.height || 1080}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}