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
  ChevronRight,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import { GalleryFilter } from './gallery-filter';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  path: string;  // 원본 파일 경로 추가
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
  const [filters, setFilters] = useState({
    sortBy: 'takenAt' as 'takenAt' | 'uploadedAt',
    order: 'desc' as 'desc' | 'asc',
    mediaType: 'all' as 'image' | 'video' | 'all',
    cameraMake: undefined as string | undefined
  });
  const [cameraOptions, setCameraOptions] = useState<string[]>([]);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
  const [mediaCounts, setMediaCounts] = useState({ images: 0, videos: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  // 미디어 데이터 로드
  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // URL 파라미터 구성
      const params = new URLSearchParams({
        sortBy: filters.sortBy,
        order: filters.order,
        limit: '200'
      });
      
      if (filters.mediaType && filters.mediaType !== 'all') {
        params.append('type', filters.mediaType);
      }

      const response = await fetch(`/api/groups/${groupId}/media?${params}`, {
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
      
      // 카메라 옵션 추출
      const cameras = new Set<string>();
      flatMedia.forEach((item: MediaItem) => {
        if (item.metadata?.cameraMake) {
          const cameraName = item.metadata.cameraModel 
            ? `${item.metadata.cameraMake} ${item.metadata.cameraModel}`
            : item.metadata.cameraMake;
          cameras.add(cameraName);
        }
      });
      setCameraOptions(Array.from(cameras).sort());
      
      // 미디어 타입별 카운트 계산
      const imageCount = flatMedia.filter((item: MediaItem) => 
        item.mimeType.startsWith('image/')
      ).length;
      const videoCount = flatMedia.filter((item: MediaItem) => 
        item.mimeType.startsWith('video/')
      ).length;
      setMediaCounts({ images: imageCount, videos: videoCount });

    } catch (error) {
      console.error('미디어 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, filters.sortBy, filters.order, filters.mediaType]);

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

  // 미디어 삭제
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('이 미디어를 삭제하시겠습니까?')) return;
    
    try {
      setDeletingMedia(mediaId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('미디어 삭제 실패');
      }

      // 삭제 성공 시 갤러리 새로고침
      closeModal();
      loadMedia();
    } catch (error) {
      console.error('미디어 삭제 오류:', error);
      alert('미디어 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingMedia(null);
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
    // 썸네일 경로가 있으면 직접 사용 (Nginx가 서빙)
    if (media.thumbnailPath) {
      return media.thumbnailPath;
    }
    // 썸네일이 없으면 API를 통해 생성
    if (media.mimeType.startsWith('image/')) {
      return `/api/media/thumbnail/${media.id}`;
    }
    return null;
  };
  
  // 원본 파일 URL 생성
  const getOriginalUrl = (media: MediaItem) => {
    // 파일 경로가 있으면 직접 사용 (Nginx가 서빙)
    if (media.path && media.path.startsWith('/uploads/')) {
      return media.path;
    }
    // fallback으로 API 사용
    return `/api/media/file/${media.id}`;
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
      <div className="sticky top-0 z-20 bg-stone-900/80 backdrop-blur-xl border-b border-stone-700/30">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800/50 hover:bg-stone-700/50 border border-stone-600/50 text-stone-300 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </button>
          
          <h1 className="text-xl font-semibold text-white">갤러리</h1>
          
          <div className="flex items-center gap-3 text-sm text-stone-400">
            {mediaCounts.images > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-stone-300">{mediaCounts.images}</span>
                <span>사진</span>
              </span>
            )}
            {mediaCounts.videos > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-stone-300">{mediaCounts.videos}</span>
                <span>동영상</span>
              </span>
            )}
            {mediaCounts.images === 0 && mediaCounts.videos === 0 && (
              <span>미디어 없음</span>
            )}
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <GalleryFilter 
        filters={filters}
        onFilterChange={(newFilters) => setFilters({
          ...newFilters,
          mediaType: newFilters.mediaType || 'all',
          cameraMake: newFilters.cameraMake || undefined
        })}
        cameraOptions={cameraOptions}
      />

      {/* 갤러리 그리드 */}
      <div className="p-4 space-y-8 max-w-6xl mx-auto">
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

              {/* 미디어 그리드 - Masonry 레이아웃 */}
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
                {group.media.map((media, index) => {
                  // 랜덤한 aspect ratio로 돌처럼 보이게 하기
                  const aspectRatios = ['aspect-square', 'aspect-[4/5]', 'aspect-[5/4]', 'aspect-[3/4]', 'aspect-[4/3]'];
                  const randomAspect = aspectRatios[index % aspectRatios.length];
                  
                  return (
                    <motion.div
                      key={media.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative ${randomAspect} bg-stone-800 rounded-xl overflow-hidden cursor-pointer group break-inside-avoid mb-2`}
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
                  );
                })}
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
                    src={getOriginalUrl(selectedMedia)}
                    alt={selectedMedia.originalName}
                    width={selectedMedia.metadata.width || 800}
                    height={selectedMedia.metadata.height || 600}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={getOriginalUrl(selectedMedia)}
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
                    <button 
                      onClick={() => handleDeleteMedia(selectedMedia.id)}
                      disabled={deletingMedia === selectedMedia.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
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