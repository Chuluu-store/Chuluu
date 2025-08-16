"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Media } from "../../../entities/media";
import { formatFileSize, formatDate } from "../../../shared/lib";
import { Button } from "../../../shared/ui";

interface MediaViewerProps {
  media: Media[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function MediaViewer({
  media,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
}: MediaViewerProps) {
  const [showInfo, setShowInfo] = useState(false);
  const currentMedia = media[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrevious();
          break;
        case "ArrowRight":
          onNext();
          break;
        case "i":
        case "I":
          setShowInfo((prev) => !prev);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onPrevious, onNext]);

  if (!isOpen || !currentMedia) return null;

  const isVideo = currentMedia.type === "video";
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < media.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 p-2"
        >
          <svg
            className="w-6 h-6"
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

        {/* Info toggle */}
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className="absolute top-4 left-4 z-10 text-white hover:text-gray-300 p-2"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Navigation */}
        {hasPrevious && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 p-2"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 p-2"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Media content */}
        <div
          className="max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <video
              src={currentMedia.path}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          ) : (
            <Image
              src={currentMedia.path}
              alt={currentMedia.originalName}
              width={currentMedia.metadata.width}
              height={currentMedia.metadata.height}
              className="max-w-full max-h-full object-contain"
              priority
            />
          )}
        </div>

        {/* Info panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute right-0 top-0 h-full w-80 bg-black/80 text-white p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">정보</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">
                    파일명
                  </h4>
                  <p className="text-sm break-all">
                    {currentMedia.originalName}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">
                    크기
                  </h4>
                  <p className="text-sm">{formatFileSize(currentMedia.size)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">
                    해상도
                  </h4>
                  <p className="text-sm">
                    {currentMedia.metadata.width} ×{" "}
                    {currentMedia.metadata.height}
                  </p>
                </div>

                {isVideo && currentMedia.metadata.duration && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      재생시간
                    </h4>
                    <p className="text-sm">
                      {Math.round(currentMedia.metadata.duration)}초
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">
                    업로드일
                  </h4>
                  <p className="text-sm">
                    {formatDate(currentMedia.createdAt)}
                  </p>
                </div>

                {currentMedia.metadata.dateTaken && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      촬영일
                    </h4>
                    <p className="text-sm">
                      {formatDate(currentMedia.metadata.dateTaken)}
                    </p>
                  </div>
                )}

                {currentMedia.metadata.location && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">
                      위치
                    </h4>
                    <p className="text-sm">
                      {currentMedia.metadata.location.latitude.toFixed(6)},{" "}
                      {currentMedia.metadata.location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-white border-white hover:bg-white hover:text-black"
                >
                  다운로드
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
