'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

import { ROUTES } from '../../../shared/config';
import { formatDate } from '../../../shared/lib';
import { LoadingSpinner } from '../../../shared/ui';
import { useAlbumList } from '../../../entities/album';
import { ShareAlbumModal } from '../../../features/share-album';

interface AlbumListProps {
  currentAlbumId?: string;
  className?: string;
}

export function AlbumList({ currentAlbumId, className }: AlbumListProps) {
  const [shareModalState, setShareModalState] = useState<{
    isOpen: boolean;
    albumId: string;
    albumName: string;
    shareToken?: string;
  }>({
    isOpen: false,
    albumId: '',
    albumName: '',
  });

  const { data: albums = [], isLoading, error } = useAlbumList();

  // Type assertion for albums since useQuery returns unknown
  const typedAlbums = albums as Array<{
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    shareToken?: string;
    isPublic: boolean;
    mediaCount: number;
    createdAt: Date;
  }>;

  const handleShare = (albumId: string, albumName: string, shareToken?: string) => {
    setShareModalState({
      isOpen: true,
      albumId,
      albumName,
      shareToken,
    });
  };

  const closeShareModal = () => {
    setShareModalState((prev) => ({ ...prev, isOpen: false }));
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center py-4 ${className}`}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center py-4 text-red-600 ${className}`}>앨범을 불러올 수 없습니다</div>;
  }

  return (
    <>
      <div className={className}>
        <h3 className="text-sm font-medium text-gray-900 mb-3">앨범</h3>

        {typedAlbums.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-sm">아직 앨범이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-1">
            {typedAlbums.map((album) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  group rounded-lg p-3 transition-colors
                  ${currentAlbumId === album.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center justify-between">
                  <Link href={ROUTES.album(album.id)} className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {/* Cover image or placeholder */}
                      <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                        {album.coverImage ? (
                          <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Album info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{album.name}</p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>{album.mediaCount}개 항목</span>
                          {album.isPublic && (
                            <>
                              <span>•</span>
                              <span>공개</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleShare(album.id, album.name, album.shareToken)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="공유"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Description */}
                {album.description && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{album.description}</p>}

                {/* Date */}
                <p className="mt-1 text-xs text-gray-500">{formatDate(album.createdAt)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ShareAlbumModal
        albumId={shareModalState.albumId}
        albumName={shareModalState.albumName}
        currentToken={shareModalState.shareToken}
        isOpen={shareModalState.isOpen}
        onClose={closeShareModal}
      />
    </>
  );
}
