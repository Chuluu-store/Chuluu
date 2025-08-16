'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '../model';
import { Button } from '../../../shared/ui';

export function UploadProgress() {
  const { uploads, clearCompleted, clearAll } = useUploadStore();

  if (uploads.length === 0) return null;

  const completedUploads = uploads.filter(u => u.status === 'completed');
  const errorUploads = uploads.filter(u => u.status === 'error');
  const activeUploads = uploads.filter(u => 
    u.status === 'pending' || u.status === 'uploading' || u.status === 'processing'
  );

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">
          업로드 진행상황 ({uploads.length})
        </h3>
        <div className="flex gap-2">
          {completedUploads.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
            >
              완료된 항목 제거
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
          >
            모두 제거
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        <AnimatePresence>
          {uploads.map((upload) => (
            <motion.div
              key={upload.fileId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border rounded p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {upload.filename}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  upload.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : upload.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {upload.status === 'pending' && '대기중'}
                  {upload.status === 'uploading' && '업로드중'}
                  {upload.status === 'processing' && '처리중'}
                  {upload.status === 'completed' && '완료'}
                  {upload.status === 'error' && '오류'}
                </span>
              </div>

              {upload.status !== 'completed' && upload.status !== 'error' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${upload.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              {upload.error && (
                <p className="text-red-600 text-xs mt-1">{upload.error}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {activeUploads.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              진행중: {activeUploads.length}, 
              완료: {completedUploads.length}, 
              오류: {errorUploads.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}