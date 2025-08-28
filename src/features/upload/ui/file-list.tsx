import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileImage, FileVideo, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { UploadFile } from '../model/upload-types';
import { formatFileSize } from '../lib/upload-utils';

interface FileListProps {
  files: UploadFile[];
  isUploading: boolean;
  onRemoveFile: (fileId: string) => void;
  onRetryFile?: (fileId: string) => void;
}

const getFileIcon = (file: File, previewUrl?: string) => {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

  if (file.type.startsWith('image/') || isHeic) {
    // HEIC 파일이고 미리보기 URL이 있으면 썸네일 표시
    if (previewUrl && isHeic) {
      return (
        <div className="relative w-8 h-8 rounded overflow-hidden">
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    return <FileImage className="w-8 h-8 text-blue-400" />;
  } else if (file.type.startsWith('video/')) {
    return <FileVideo className="w-8 h-8 text-purple-400" />;
  }
  return <FileImage className="w-8 h-8 text-stone-400" />;
};

const getStatusIcon = (status: UploadFile['status']) => {
  switch (status) {
    case 'pending':
      return <div className="w-6 h-6 rounded-full bg-stone-600" />;
    case 'uploading':
      return <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-6 h-6 text-green-400" />;
    case 'failed':
      return <AlertCircle className="w-6 h-6 text-red-400" />;
  }
};

export function FileList({ files, isUploading, onRemoveFile, onRetryFile }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      <AnimatePresence>
        {files.map((uploadFile) => (
          <motion.div
            key={uploadFile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-4 p-4 bg-stone-900/40 backdrop-blur-sm border border-stone-700/50 rounded-xl hover:bg-stone-900/60 transition-all duration-200"
          >
            {/* 파일 아이콘 */}
            <div className="flex-shrink-0">{getFileIcon(uploadFile.file, uploadFile.previewUrl)}</div>

            {/* 파일 정보 */}
            <div className="flex-grow min-w-0">
              <div className="font-medium text-white truncate mb-1">{uploadFile.file.name}</div>
              <div className="text-sm text-stone-400 mb-2">{formatFileSize(uploadFile.file.size)}</div>

              {/* 진행률 바 */}
              {uploadFile.status === 'uploading' && (
                <div className="mt-2">
                  <div className="w-full bg-stone-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadFile.progress}%` }}
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-stone-400">업로드 중...</span>
                    <span className="text-blue-400 font-medium">{uploadFile.progress}%</span>
                  </div>
                </div>
              )}

              {/* 에러 메시지 */}
              {uploadFile.status === 'failed' && uploadFile.error && (
                <div className="mt-2">
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-xs text-red-400">{uploadFile.error}</div>
                  </div>
                  {onRetryFile && (
                    <button
                      onClick={() => onRetryFile(uploadFile.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-stone-300 hover:text-white bg-stone-700 hover:bg-stone-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      다시 시도
                    </button>
                  )}
                </div>
              )}

              {/* 완료 메시지 */}
              {uploadFile.status === 'completed' && (
                <div className="mt-2 text-xs text-green-400 font-medium">업로드 완료</div>
              )}
            </div>

            {/* 상태 아이콘 */}
            <div className="flex-shrink-0">{getStatusIcon(uploadFile.status)}</div>

            {/* 삭제 버튼 */}
            {!isUploading && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onRemoveFile(uploadFile.id)}
                className="flex-shrink-0 p-2 hover:bg-stone-700/50 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4 text-stone-400 hover:text-red-400" />
              </motion.button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
