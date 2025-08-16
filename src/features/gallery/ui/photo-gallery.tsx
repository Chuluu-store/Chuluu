'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  User, 
  Calendar,
  Camera,
  MapPin,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  thumbnailPath?: string;
  uploadedBy: {
    id: string;
    username: string;
    email: string;
  };
  uploadedAt: string;
  takenAt: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    cameraMake?: string;
    cameraModel?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

interface DateGroup {
  date: string;
  displayDate: string;
  count: number;
  media: MediaItem[];
}

interface PhotoGalleryProps {
  groupId: string;
  onBack?: () => void;
}

export function PhotoGallery({ groupId, onBack }: PhotoGalleryProps) {
  const [mediaGroups, setMediaGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 미디어 데이터 로드
  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/groups/${groupId}/media?sortBy=takenAt&order=desc&limit=200`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('미디어 로드 실패');
      }

      const result = await response.json();
      setMediaGroups(result.data);
      
      // 전체 미디어 배열 생성 (모달 네비게이션용)
      const flatMedia = result.data.reduce((acc: MediaItem[], group: DateGroup) => {
        return [...acc, ...group.media];
      }, []);
      setAllMedia(flatMedia);

    } catch (error) {
      console.error('미디어 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // 미디어 클릭 핸들러
  const handleMediaClick = (media: MediaItem) => {
    const index = allMedia.findIndex(item => item.id === media.id);
    setSelectedIndex(index);
    setSelectedMedia(media);
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedMedia(null);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // 이전/다음 미디어
  const navigateMedia = (direction: 'prev' | 'next') => {
    if (allMedia.length === 0) return;
    
    let newIndex = selectedIndex;
    if (direction === 'prev') {
      newIndex = selectedIndex > 0 ? selectedIndex - 1 : allMedia.length - 1;
    } else {
      newIndex = selectedIndex < allMedia.length - 1 ? selectedIndex + 1 : 0;
    }
    
    setSelectedIndex(newIndex);
    setSelectedMedia(allMedia[newIndex]);
    setIsVideoPlaying(false);
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedMedia) return;
      
      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          navigateMedia('prev');
          break;
        case 'ArrowRight':
          navigateMedia('next');
          break;
        case ' ':
          e.preventDefault();
          if (selectedMedia.mimeType.startsWith('video/')) {
            toggleVideoPlay();
          }
          break;
      }
    };

    if (selectedMedia) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedMedia, selectedIndex, allMedia]);

  // 비디오 재생/일시정지
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // 비디오 음소거 토글
  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 썸네일 URL 생성
  const getThumbnailUrl = (media: MediaItem) => {
    if (media.thumbnailPath) {
      return `/api/media/thumbnail/${media.id}`;
    }
    // 썸네일이 없으면 원본 이미지 사용 (비디오는 기본 아이콘)
    if (media.mimeType.startsWith('image/')) {
      return `/api/media/file/${media.id}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-white">갤러리 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-stone-900/80 backdrop-blur-xl border-b border-stone-700/30">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800/50 hover:bg-stone-700/50 border border-stone-600/50 text-stone-300 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </button>
          
          <h1 className="text-xl font-semibold text-white">갤러리</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-400">
              총 {allMedia.length}개
            </span>
          </div>
        </div>
      </div>

      {/* 갤러리 그리드 */}
      <div className="p-4 space-y-8">
        {mediaGroups.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-stone-400 text-lg">업로드된 사진이나 동영상이 없습니다</div>
          </div>
        ) : (
          mediaGroups.map((group) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* 날짜 헤더 */}
              <div className="sticky top-20 z-5 bg-stone-900/80 backdrop-blur-sm py-2">
                <h2 className="text-lg font-semibold text-white">
                  {group.displayDate}
                </h2>
                <p className="text-sm text-stone-400">
                  {group.count}개 항목
                </p>
              </div>

              {/* 미디어 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {group.media.map((media) => (
                  <motion.div
                    key={media.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative aspect-square bg-stone-800 rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => handleMediaClick(media)}
                  >
                    {/* 썸네일 */}
                    {media.mimeType.startsWith('image/') ? (
                      <Image
                        src={getThumbnailUrl(media) || '/placeholder-image.png'}
                        alt={media.originalName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-700">
                        <Play className="w-8 h-8 text-white/60" />
                      </div>
                    )}

                    {/* 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                    {/* 비디오 표시 */}
                    {media.mimeType.startsWith('video/') && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-black/60 rounded-full p-1">
                          <Play className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}

                    {/* 업로더 정보 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <div className="flex items-center gap-1 text-xs text-white/80">
                        <User className="w-3 h-3" />
                        <span className="truncate">{media.uploadedBy.username}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 미디어 모달 */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeModal}
          >
            {/* 모달 컨텐츠 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* 네비게이션 버튼 */}
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={() => navigateMedia('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => navigateMedia('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* 미디어 컨텐츠 */}
              <div className="relative max-w-full max-h-full">
                {selectedMedia.mimeType.startsWith('image/') ? (
                  <Image
                    src={`/api/media/file/${selectedMedia.id}`}
                    alt={selectedMedia.originalName}
                    width={selectedMedia.metadata.width || 800}
                    height={selectedMedia.metadata.height || 600}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={`/api/media/file/${selectedMedia.id}`}
                      className="max-w-full max-h-[70vh]"
                      controls={false}
                      muted={isVideoMuted}
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                    />
                    
                    {/* 비디오 컨트롤 */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <button
                        onClick={toggleVideoPlay}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <button
                        onClick={toggleVideoMute}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                      >
                        {isVideoMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 메타데이터 패널 */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{selectedMedia.originalName}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{selectedMedia.uploadedBy.username}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(selectedMedia.takenAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      
                      {selectedMedia.metadata.cameraMake && (
                        <div className="flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          <span>
                            {selectedMedia.metadata.cameraMake} {selectedMedia.metadata.cameraModel}
                          </span>
                        </div>
                      )}
                      
                      {selectedMedia.metadata.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>위치 정보</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-white/60">
                      {formatFileSize(selectedMedia.size)} • {selectedMedia.metadata.width}×{selectedMedia.metadata.height}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}