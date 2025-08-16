"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
}

export function MediaGridWidget() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch("/api/media?page=1&limit=50");
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      
      // 모든 선택된 파일을 FormData에 추가
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('업로드에 실패했습니다');
      }

      const result = await response.json();
      
      // 성공 시 미디어 목록 새로고침
      await fetchMedia();
      
      // 파일 입력 초기화
      event.target.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('파일 업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
    }
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
      <div className="glass-card p-4 rounded-3xl">
        <div className="grid grid-cols-3 gap-2">
          {media.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative aspect-square cursor-pointer overflow-hidden glass-card rounded-2xl"
              onClick={() => handleMediaClick(item)}
            >
              {item.isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center bg-gray-800">
                  <video
                    src={item.path}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center glass">
                    <div className="glass-button p-3 rounded-full">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full bg-gray-800">
                  <Image
                    src={item.thumbnail || item.path}
                    alt={item.originalName}
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {media.length === 0 && (
          <div 
            className={`flex items-center bg-white/[0.04] border border-white/[0.1] rounded-2xl p-4 cursor-pointer hover:bg-white/[0.08] hover:border-white/25 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !uploading && document.getElementById('photo-upload')?.click()}
          >
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white/[0.05] rounded-xl mr-4">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-6 h-6 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white mb-1">
                {uploading ? '업로드 중...' : '사진 업로드'}
              </h3>
              <p className="text-sm text-gray-400">
                {uploading ? '파일을 업로드하고 있습니다' : '사진을 선택하여 그룹에 업로드하세요'}
              </p>
            </div>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
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
            className="fixed inset-0 z-50 glass flex items-center justify-center p-6"
            onClick={closeModal}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-8 right-8 glass-button p-4 rounded-2xl z-50 safe-top"
              onClick={closeModal}
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
            </motion.button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-full max-h-full glass-card rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.isVideo ? (
                <video
                  src={selectedMedia.path}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] rounded-3xl"
                />
              ) : (
                <Image
                  src={selectedMedia.path}
                  alt={selectedMedia.originalName}
                  width={selectedMedia.metadata?.width || 1920}
                  height={selectedMedia.metadata?.height || 1080}
                  className="max-w-full max-h-[80vh] object-contain rounded-3xl"
                />
              )}

              {/* Media Info */}
              <div className="absolute bottom-0 left-0 right-0 glass p-6 m-4 rounded-2xl">
                <h3 className="text-white font-medium mb-1">
                  {selectedMedia.originalName}
                </h3>
                <p className="text-gray-300 text-sm">
                  {selectedMedia.metadata?.dateTaken
                    ? new Date(
                        selectedMedia.metadata.dateTaken
                      ).toLocaleDateString()
                    : new Date(selectedMedia.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
