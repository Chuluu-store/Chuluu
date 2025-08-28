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
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';

import { GalleryFilter } from './gallery-filter';
import { toast } from '../../../shared/lib/toast';

// HEIC 이미지 뷰어 컴포넌트
function HeicImageViewer({
  media,
  getThumbnailUrl,
  getOriginalUrl,
}: {
  media: MediaItem;
  getThumbnailUrl: (media: MediaItem) => string;
  getOriginalUrl: (media: MediaItem) => string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [originalError, setOriginalError] = useState(false);

  // HEIC 파일인지 확인
  const isHeic =
    media.mimeType === 'image/heic' ||
    media.mimeType === 'image/heif' ||
    media.originalName.toLowerCase().endsWith('.heic') ||
    media.originalName.toLowerCase().endsWith('.heif');

  useEffect(() => {
    setImageLoaded(false);
    setShowThumbnail(true);
    setOriginalError(false);
  }, [media.id]);

  const handleOriginalLoad = () => {
    console.log('[HeicImageViewer] 원본 이미지 로드 완료 :', media.originalName);
    setImageLoaded(true);
    setShowThumbnail(false);
  };

  const handleOriginalError = () => {
    console.log('[HeicImageViewer] 원본 이미지 로드 실패, 썸네일 사용 :', media.originalName);
    setOriginalError(true);
    setShowThumbnail(true);
  };

  return (
    <div className="relative">
      {/* 썸네일 이미지 (HEIC는 먼저 보여줌, 일반 이미지는 로딩 실패시만) */}
      {(showThumbnail || originalError) && (
        <Image
          src={getThumbnailUrl(media)}
          alt={`${media.originalName} 미리보기`}
          width={media.metadata.width || 800}
          height={media.metadata.height || 600}
          className="max-w-full max-h-[70vh] object-contain"
          priority
        />
      )}

      {/* 원본 이미지 */}
      <Image
        src={getOriginalUrl(media)}
        alt={media.originalName}
        width={media.metadata.width || 800}
        height={media.metadata.height || 600}
        className={`max-w-full max-h-[70vh] object-contain transition-opacity duration-300 ${
          imageLoaded && !originalError ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        onLoad={handleOriginalLoad}
        onError={handleOriginalError}
        priority={!isHeic}
      />

      {/* 로딩 인디케이터 (HEIC 파일용) */}
      {isHeic && showThumbnail && !originalError && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            원본 로딩 중...
          </div>
        </div>
      )}
    </div>
  );
}

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  path: string; // 원본 파일 경로 추가
  mimeType: string;
  size: number;
  thumbnailPath?: string;
  uploadedBy: {
    id: string;
    username: string;
    email: string;
  };
  uploadedAt: string;
  createdAt?: string; // 업로드 날짜
  takenAt: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    takenAt?: string; // 메타데이터에서 촬영 날짜
    cameraMake?: string;
    cameraModel?: string;
    iso?: number;
    fNumber?: number;
    exposureTime?: string;
    focalLength?: number;
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
    cameraMake: undefined as string | undefined,
  });
  const [cameraOptions, setCameraOptions] = useState<string[]>([]);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
  const [mediaCounts, setMediaCounts] = useState({ images: 0, videos: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
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
        limit: '200',
      });

      if (filters.mediaType && filters.mediaType !== 'all') {
        params.append('type', filters.mediaType);
      }

      const response = await fetch(`/api/groups/${groupId}/media?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      const imageCount = flatMedia.filter((item: MediaItem) => item.mimeType.startsWith('image/')).length;
      const videoCount = flatMedia.filter((item: MediaItem) => item.mimeType.startsWith('video/')).length;
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
    const index = allMedia.findIndex((item) => item.id === media.id);
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

  // 미디어 다운로드 (HEIC 원본 보존)
  const handleDownloadMedia = async (media: MediaItem) => {
    try {
      toast.info('다운로드 중...');

      // HEIC 파일의 경우 원본 다운로드를 위해 특별 처리
      const isHeic =
        media.mimeType === 'image/heic' ||
        media.mimeType === 'image/heif' ||
        media.originalName.toLowerCase().endsWith('.heic') ||
        media.originalName.toLowerCase().endsWith('.heif');

      // 원본 파일 다운로드 URL (HEIC는 변환하지 않음)
      const downloadUrl = isHeic
        ? `/api/media/download/${media.id}` // 원본 다운로드 전용 엔드포인트
        : getOriginalUrl(media);

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = media.originalName; // 원본 파일명 유지
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('다운로드가 완료되었습니다');
    } catch (error) {
      console.error('다운로드 실패:', error);
      toast.error('다운로드에 실패했습니다');
    }
  };

  // 미디어 공유
  const handleShareMedia = async (media: MediaItem) => {
    if (isSharing) return; // 이미 공유 중이면 무시

    try {
      setIsSharing(true);
      const shareUrl = `${window.location.origin}/api/media/file/${media.id}`;

      // 모바일에서 네이티브 공유 지원
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: media.originalName,
            text: `${media.originalName} 공유`,
            url: shareUrl,
          });
          toast.success('공유가 완료되었습니다');
        } catch (err: any) {
          // 사용자가 공유를 취소한 경우
          if (err.name !== 'AbortError') {
            throw err;
          }
        }
      } else {
        // 데스크톱에서는 클립보드에 복사
        await navigator.clipboard.writeText(shareUrl);
        toast.success('링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      toast.error('공유에 실패했습니다');
    } finally {
      setIsSharing(false);
    }
  };

  // 삭제 모달 표시
  const showDeleteConfirm = (mediaId: string) => {
    setMediaToDelete(mediaId);
    setShowDeleteModal(true);
  };

  // 미디어 삭제
  const handleDeleteMedia = async () => {
    if (!mediaToDelete) return;

    try {
      setDeletingMedia(mediaToDelete);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/media/${mediaToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('미디어 삭제 실패');
      }

      // 삭제 성공 시 갤러리 새로고침
      closeModal();
      loadMedia();
      toast.success('미디어가 삭제되었습니다');
    } catch (error) {
      console.error('미디어 삭제 오류:', error);
      toast.error('미디어 삭제에 실패했습니다');
    } finally {
      setDeletingMedia(null);
      setShowDeleteModal(false);
      setMediaToDelete(null);
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
    // 항상 API를 통해 썸네일 가져오기 (캐싱 및 권한 처리)
    // 이미지와 비디오 모두 썸네일 API 사용
    return `/api/media/thumbnail/${media.id}`;
  };

  // 원본 파일 URL 생성
  const getOriginalUrl = (media: MediaItem) => {
    // 항상 API를 통해 파일 가져오기 (권한 처리 및 경로 호환성)
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
    <div className="min-h-screen bg-stone-900 relative">
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
            {mediaCounts.images === 0 && mediaCounts.videos === 0 && <span>미디어 없음</span>}
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <GalleryFilter
        filters={filters}
        onFilterChange={(newFilters) =>
          setFilters({
            ...newFilters,
            mediaType: newFilters.mediaType || 'all',
            cameraMake: newFilters.cameraMake || undefined,
          })
        }
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
                <h2 className="text-lg font-semibold text-white">{group.displayDate}</h2>
                <p className="text-sm text-stone-400">{group.count}개 항목</p>
              </div>

              {/* 미디어 그리드 - Masonry 레이아웃 */}
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
                {group.media.map((media, index) => {
                  // 랜덤한 aspect ratio로 돌처럼 보이게 하기
                  const aspectRatios = [
                    'aspect-square',
                    'aspect-[4/5]',
                    'aspect-[5/4]',
                    'aspect-[3/4]',
                    'aspect-[4/3]',
                  ];
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
                      {/* 썸네일 이미지 - 비디오와 이미지 모두 동일하게 처리 */}
                      <Image
                        src={getThumbnailUrl(media)}
                        alt={media.originalName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // 썸네일 로드 실패시 원본 시도
                          if (!target.src.includes('/api/media/file/')) {
                            target.src = `/api/media/file/${media.id}`;
                          }
                        }}
                      />

                      {/* 비디오 재생 버튼 오버레이 */}
                      {media.mimeType.startsWith('video/') && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 rounded-full p-3">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        </div>
                      )}

                      {/* 오버레이 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

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
            className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center"
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
                  <HeicImageViewer
                    media={selectedMedia}
                    getThumbnailUrl={getThumbnailUrl}
                    getOriginalUrl={getOriginalUrl}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={getOriginalUrl(selectedMedia)}
                    className="max-w-full max-h-[70vh] rounded-lg"
                    controls={true}
                    autoPlay={false}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                )}
              </div>

              {/* 메타데이터 패널 */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{selectedMedia.originalName}</h3>

                    {/* 주요 정보 */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-white/60" />
                        <span className="text-white/80">업로더: {selectedMedia.uploadedBy.username}</span>
                      </div>

                      {selectedMedia.metadata?.takenAt ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-white/60" />
                          <span className="text-white/80">
                            촬영: {new Date(selectedMedia.metadata.takenAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-white/60" />
                          <span className="text-white/60 italic">촬영: 정보 없음</span>
                        </div>
                      )}

                      {(selectedMedia.createdAt || selectedMedia.uploadedAt) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-white/60" />
                          <span className="text-white/80">
                            업로드:{' '}
                            {new Date(selectedMedia.createdAt || selectedMedia.uploadedAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      )}

                      {(selectedMedia.metadata.cameraMake || selectedMedia.metadata.cameraModel) && (
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-white/60" />
                          <span className="text-white/80">
                            {[selectedMedia.metadata.cameraMake, selectedMedia.metadata.cameraModel]
                              .filter(Boolean)
                              .join(' ')}
                          </span>
                        </div>
                      )}

                      {selectedMedia.metadata.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-white/60" />
                          <span className="text-white/80">
                            위치: {selectedMedia.metadata.location.latitude?.toFixed(6)},
                            {selectedMedia.metadata.location.longitude?.toFixed(6)}
                          </span>
                        </div>
                      )}

                      {/* 기술적 정보 */}
                      <div className="col-span-2 pt-1 border-t border-white/10">
                        <div className="flex flex-wrap gap-3 text-xs text-white/60">
                          <span>크기: {formatFileSize(selectedMedia.size)}</span>
                          {selectedMedia.metadata.width && selectedMedia.metadata.height && (
                            <span>
                              해상도: {selectedMedia.metadata.width}×{selectedMedia.metadata.height}
                            </span>
                          )}
                          {selectedMedia.metadata.iso && <span>ISO: {selectedMedia.metadata.iso}</span>}
                          {selectedMedia.metadata.fNumber && <span>조리개: f/{selectedMedia.metadata.fNumber}</span>}
                          {selectedMedia.metadata.exposureTime && (
                            <span>셔터: {selectedMedia.metadata.exposureTime}s</span>
                          )}
                          {selectedMedia.metadata.focalLength && (
                            <span>초점거리: {selectedMedia.metadata.focalLength}mm</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareMedia(selectedMedia)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="공유"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadMedia(selectedMedia)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="다운로드"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => showDeleteConfirm(selectedMedia.id)}
                      disabled={deletingMedia === selectedMedia.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                      title="삭제"
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

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[2100] flex items-center justify-center">
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowDeleteModal(false)}
            />

            {/* 모달 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-stone-800 rounded-2xl p-6 w-[90%] max-w-sm z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">미디어 삭제</h3>
                <p className="text-stone-300 text-sm mb-6">
                  이 미디어를 삭제하시겠습니까?
                  <br />
                  삭제된 미디어는 복구할 수 없습니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteMedia}
                    disabled={deletingMedia !== null}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingMedia ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
