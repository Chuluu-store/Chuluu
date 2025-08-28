'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Image as ImageIcon, Video, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  message: string;
}

interface UploadZoneProps {
  groupId?: string;
}

export function UploadZone({ groupId }: UploadZoneProps = {}) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus({
      status: 'uploading',
      progress: 0,
      message: `${files.length}개 파일 업로드 중...`,
    });

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setUploadStatus((prev) => ({
        ...prev,
        progress: Math.min(prev.progress + Math.random() * 20, 90),
      }));
    }, 500);

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (groupId) {
        headers['X-Group-Id'] = groupId;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        await response.json();
        setUploadStatus({
          status: 'success',
          progress: 100,
          message: `${files.length}개 파일이 성공적으로 업로드되었습니다!`,
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('업로드 실패');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: '업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadStatus({ status: 'idle', progress: 0, message: '' });
      }, 3000);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleZoneClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        disabled={uploading}
      />

      <AnimatePresence mode="wait">
        {uploadStatus.status === 'idle' && (
          <motion.div
            key="upload-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleZoneClick}
            className="glass-button px-6 py-3 rounded-2xl text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 border-blue-400/20 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 group"
          >
            <Upload className="w-4 h-4 group-hover:animate-bounce" />
            <span>사진 업로드</span>
            <div className="hidden sm:flex items-center space-x-1 ml-2 text-xs text-gray-400">
              <ImageIcon className="w-3 h-3" />
              <Video className="w-3 h-3" />
            </div>
          </motion.div>
        )}

        {uploadStatus.status === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-button px-6 py-3 rounded-2xl bg-blue-500/10 border-blue-400/20 min-w-[200px]"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="text-blue-400"
              >
                <Camera className="w-4 h-4" />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-400">업로드 중</span>
                  <span className="text-xs text-blue-400">{Math.round(uploadStatus.progress)}%</span>
                </div>
                <div className="w-full bg-blue-900/30 rounded-full h-1.5">
                  <motion.div
                    className="bg-blue-400 h-1.5 rounded-full"
                    style={{ width: `${uploadStatus.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{uploadStatus.message}</p>
          </motion.div>
        )}

        {uploadStatus.status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-button px-6 py-3 rounded-2xl bg-green-500/10 border-green-400/20"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">업로드 완료!</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{uploadStatus.message}</p>
          </motion.div>
        )}

        {uploadStatus.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-button px-6 py-3 rounded-2xl bg-red-500/10 border-red-400/20"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">업로드 실패</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{uploadStatus.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 드래그 앤 드롭 힌트 (데스크톱만) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="hidden lg:block absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap"
      >
        최대 5000개 파일 • JPG, PNG, HEIC, MP4, MOV 지원
      </motion.div>
    </div>
  );
}
