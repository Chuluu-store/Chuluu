"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";

interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  thumbnail?: string;
  isVideo: boolean;
  uploadedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    dateTaken?: string;
  };
  group?: {
    _id: string;
    name: string;
  };
}

export function MediaGridWidget() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/media?limit=10", {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      const data = await response.json();

      if (data.media) {
        setMedia(data.media);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching media:", error);
      setLoading(false);
    }
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
  };

  const closeModal = () => {
    setSelectedMedia(null);
  };

  if (loading) {
    return (
      <div className="glass-card p-8 rounded-3xl">
        <div className="flex justify-center items-center h-64">
          <div className="loading-shimmer w-12 h-12 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-stone-800/50 backdrop-blur-sm p-4 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative aspect-square cursor-pointer overflow-hidden bg-stone-900 rounded-xl group"
              onClick={() => handleMediaClick(item)}
            >
              {item.isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center bg-stone-800">
                  <video
                    src={`/api/media/file/${item._id}`}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-black/60 p-2 rounded-full">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full bg-stone-800">
                  <Image
                    src={item.thumbnail ? `/api/media/thumbnail/${item._id}` : `/api/media/file/${item._id}`}
                    alt={item.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {/* 업로더 이름 표시 */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-xs text-white/80 truncate">
                      {item.group?.name || "김승찬"}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {media.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex w-16 h-16 items-center justify-center bg-stone-800/50 rounded-2xl mb-4">
              <svg
                className="w-8 h-8 text-stone-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              아직 업로드한 사진이 없네요
            </h3>
            <p className="text-sm text-stone-400 max-w-sm mx-auto">
              그룹을 만들고 사진을 업로드해보세요.
              <br />
              소중한 추억을 공유할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeModal}
          >
            {/* X 버튼 */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* 미디어 컨텐츠 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {selectedMedia.isVideo ? (
                  <video
                    src={`/api/media/file/${selectedMedia._id}`}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] rounded-xl"
                  />
                ) : (
                  <Image
                    src={`/api/media/file/${selectedMedia._id}`}
                    alt={selectedMedia.originalName}
                    width={selectedMedia.metadata?.width || 800}
                    height={selectedMedia.metadata?.height || 600}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                )}

                {/* Media Info */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {selectedMedia.originalName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <span>
                          {selectedMedia.metadata?.dateTaken
                            ? new Date(selectedMedia.metadata.dateTaken).toLocaleString('ko-KR')
                            : new Date(selectedMedia.uploadedAt).toLocaleString('ko-KR')}
                        </span>
                        {selectedMedia.group && (
                          <span className="text-white/60">
                            {selectedMedia.group.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {selectedMedia.group && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/group/${selectedMedia.group?._id}`);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-all duration-200 whitespace-nowrap"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">앨범으로 이동</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
