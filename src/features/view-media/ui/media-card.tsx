'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Media } from '../../../entities/media';
import { formatFileSize, formatDate } from '../../../shared/lib';

interface MediaCardProps {
  media: Media;
  selected?: boolean;
  showMetadata?: boolean;
  onClick?: (media: Media) => void;
  onSelect?: (media: Media) => void;
  className?: string;
}

export function MediaCard({
  media,
  selected = false,
  showMetadata = false,
  onClick,
  onSelect,
  className,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onSelect?.(media);
    } else {
      onClick?.(media);
    }
  };

  const thumbnailUrl = `/api/media/thumbnail/${media.id}?size=300`;
  const isVideo = media.type === 'video';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden
        ${selected ? 'ring-2 ring-blue-500' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Selection indicator */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              ${
                selected
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white/80 border-white/80 group-hover:bg-white group-hover:border-white'
              }
            `}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Media type indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
            {media.metadata.duration ? `${Math.round(media.metadata.duration)}s` : 'VIDEO'}
          </div>
        </div>
      )}

      {/* Image/Thumbnail */}
      <div className="aspect-square relative bg-gray-100">
        {!imageError ? (
          <Image
            src={thumbnailUrl}
            alt={media.originalName}
            fill
            className={`
              object-cover transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-gray-400">
              {isVideo ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1a1 1 0 001-1v-1h-2zm-2-2H7v4h6v-4zm2-2V7h-2v2h2zM5 7v2H3V7h2zm0 4H3v2a1 1 0 001 1h1v-3zm6-4H9v2h2V7z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {!isLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}

        {/* Play button for videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 rounded-full p-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      {showMetadata && (
        <div className="p-3 bg-white border-t">
          <p className="text-sm font-medium text-gray-900 truncate">{media.originalName}</p>
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>{formatFileSize(media.size)}</p>
            <p>{formatDate(media.createdAt)}</p>
            {media.metadata.width && media.metadata.height && (
              <p>
                {media.metadata.width} × {media.metadata.height}
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
