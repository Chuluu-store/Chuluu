'use client';

import React from 'react';
import { useInView } from 'react-intersection-observer';
import { AnimatePresence, motion } from 'framer-motion';
import { Media, useMediaStore } from '../../../entities/media';
import { useUserStore } from '../../../entities/user';
import { MediaCard } from './media-card';
import { LoadingSpinner } from '../../../shared/ui';

interface MediaGridProps {
  media: Media[];
  loading?: boolean;
  onMediaClick?: (media: Media) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  className?: string;
}

const gridSizeClasses = {
  small: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
  medium: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

export function MediaGrid({
  media,
  loading = false,
  onMediaClick,
  onLoadMore,
  hasNextPage = false,
  className,
}: MediaGridProps) {
  const { selectedMedia, selectMedia, clearSelection } = useMediaStore();
  const { preferences } = useUserStore();

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Trigger load more when scroll into view
  React.useEffect(() => {
    if (inView && hasNextPage && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasNextPage, loading, onLoadMore]);

  const gridClass = gridSizeClasses[preferences.gridSize];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSelection();
    }
  };

  if (loading && media.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-lg font-medium mb-2">사진이나 동영상이 없습니다</p>
        <p className="text-sm">파일을 업로드해서 갤러리를 채워보세요</p>
      </div>
    );
  }

  return (
    <div className={className} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Selection info */}
      {selectedMedia.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between"
        >
          <span className="text-blue-800 font-medium">{selectedMedia.length}개 항목이 선택됨</span>
          <button onClick={clearSelection} className="text-blue-600 hover:text-blue-800 text-sm">
            선택 해제
          </button>
        </motion.div>
      )}

      {/* Media grid */}
      <div className={`grid gap-2 ${gridClass}`}>
        <AnimatePresence>
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              selected={selectedMedia.some((m) => m.id === item.id)}
              showMetadata={preferences.showMetadata}
              onClick={onMediaClick}
              onSelect={selectMedia}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <button onClick={onLoadMore} className="px-6 py-2 text-blue-600 hover:text-blue-800 font-medium">
              더 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
