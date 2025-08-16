"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerateShareToken } from "../../../entities/album";
import { Button } from "../../../shared/ui";

interface ShareAlbumModalProps {
  albumId: string;
  albumName: string;
  currentToken?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareAlbumModal({
  albumId,
  albumName,
  currentToken,
  isOpen,
  onClose,
}: ShareAlbumModalProps) {
  const [shareToken, setShareToken] = useState(currentToken || "");
  const [copied, setCopied] = useState(false);

  const generateTokenMutation = useGenerateShareToken();

  const handleGenerateToken = async () => {
    try {
      const token = await generateTokenMutation.mutateAsync(albumId);
      setShareToken(token);
    } catch (error) {
      console.error("Failed to generate share token:", error);
    }
  };

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : "";

  const handleCopyUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            앨범 공유
          </h2>

          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              <span className="font-medium">{albumName}</span> 앨범을 공유합니다
            </p>
            <p className="text-sm text-gray-500">
              링크를 가진 사람은 누구나 이 앨범을 볼 수 있습니다
            </p>
          </div>

          {shareToken ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공유 링크
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-md text-sm"
                  />
                  <Button
                    onClick={handleCopyUrl}
                    variant={copied ? "secondary" : "primary"}
                    className="rounded-l-none border-l-0"
                  >
                    {copied ? "복사됨!" : "복사"}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800 text-sm">
                  💡 이 링크는 언제든 새로 생성할 수 있습니다. 보안을 위해
                  정기적으로 링크를 갱신하세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                공유 링크를 생성하여 다른 사람들과 앨범을 공유하세요
              </p>
              <Button
                onClick={handleGenerateToken}
                loading={generateTokenMutation.isPending}
              >
                공유 링크 생성
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t">
            {shareToken && (
              <Button
                variant="outline"
                onClick={handleGenerateToken}
                loading={generateTokenMutation.isPending}
                className="flex-1"
              >
                새 링크 생성
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              닫기
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
