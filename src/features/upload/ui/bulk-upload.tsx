'use client';

import React, { useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { BulkUploadProps, UploadFile, UploadStats } from '../model/upload-types';
import { generateFileId, isValidFileType, isValidFileSize } from '../lib/upload-utils';
import { FileDropZone } from './file-drop-zone';
import { UploadStats as UploadStatsComponent } from './upload-stats';
import { FileList } from './file-list';

export function BulkUpload({ groupId, onUploadComplete, onClose }: BulkUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    total: 0,
    completed: 0,
    failed: 0,
    totalSize: 0,
    estimatedTime: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 파일 선택 처리
  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach(file => {
      if (!isValidFileType(file)) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식`);
        return;
      }
      
      if (!isValidFileSize(file)) {
        errors.push(`${file.name}: 파일 크기가 500MB를 초과합니다`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(`다음 파일들을 업로드할 수 없습니다:\n${errors.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    const newFiles: UploadFile[] = validFiles.map((file) => ({
      file,
      id: generateFileId(file),
      status: 'pending',
      progress: 0
    }));

    // 최대 5000개 파일 제한
    const totalFiles = files.length + newFiles.length;
    if (totalFiles > 5000) {
      alert(`최대 5000개 파일까지만 업로드할 수 있습니다. (현재: ${totalFiles}개)`);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);

    // 통계 업데이트
    const totalSize = [...files, ...newFiles].reduce((sum, f) => sum + f.file.size, 0);
    setUploadStats(prev => ({
      ...prev,
      total: totalFiles,
      totalSize
    }));
  }, [files]);

  // 드래그 앤 드롭 처리
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 파일 제거
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const totalSize = updated.reduce((sum, f) => sum + f.file.size, 0);
      
      setUploadStats(prevStats => ({
        ...prevStats,
        total: updated.length,
        totalSize
      }));
      
      return updated;
    });
  }, []);

  // 업로드 시작 (간단한 직접 업로드 방식)
  const startUpload = async () => {
    console.log('🚀 Upload started with files:', files.length);
    if (files.length === 0) return;

    setIsUploading(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();

    try {
      setUploadStats(prev => ({
        ...prev,
        completed: 0,
        failed: 0
      }));

      // 파일 업로드 (동시 3개까지)
      console.log('📤 Starting direct file uploads...');
      const concurrentLimit = 3;
      for (let i = 0; i < files.length; i += concurrentLimit) {
        if (isPaused || abortControllerRef.current?.signal.aborted) {
          console.log('⏸️ Upload paused or aborted');
          break;
        }
        
        const batch = files.slice(i, i + concurrentLimit);
        console.log(`📦 Processing batch ${Math.floor(i/concurrentLimit) + 1}:`, batch.map(f => f.file.name));
        
        const batchPromises = batch.map((file) => 
          uploadFileDirect(file)
        );
        
        await Promise.allSettled(batchPromises);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      onUploadComplete?.(files);
    } catch (error) {
      console.error('업로드 오류:', error);
      alert(`업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  // 직접 업로드 함수 (세션 없이)
  const uploadFileDirect = async (uploadFile: UploadFile) => {
    console.log(`📁 Direct uploading file:`, uploadFile.file.name);

    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      const token = localStorage.getItem('token');
      if (!token) throw new Error('인증이 필요합니다');

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('groupId', groupId);

      const response = await fetch('/api/test-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: abortControllerRef.current!.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log(`✅ File completed:`, result);

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, mediaId: result.mediaId }
          : f
      ));

      setUploadStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    } catch (error) {
      console.error(`❌ File upload failed:`, error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'failed', error: error instanceof Error ? error.message : '업로드 실패' }
          : f
      ));

      setUploadStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    }
  };

  // 업로드 일시정지/재시작
  const togglePause = () => setIsPaused(!isPaused);

  // 업로드 취소
  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setIsPaused(false);
  };

  // 전체 진행률 계산
  const overallProgress = uploadStats.total > 0 
    ? Math.round(((uploadStats.completed + uploadStats.failed) / uploadStats.total) * 100)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">대용량 업로드</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-700/30 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-stone-400" />
          </button>
        )}
      </div>

      {/* 파일 드롭 영역 */}
      {files.length === 0 && (
        <FileDropZone
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        />
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 업로드 통계 */}
      {files.length > 0 && (
        <UploadStatsComponent
          stats={uploadStats}
          isUploading={isUploading}
          isPaused={isPaused}
          overallProgress={overallProgress}
          onAddFiles={() => fileInputRef.current?.click()}
          onStartUpload={startUpload}
          onTogglePause={togglePause}
          onCancelUpload={cancelUpload}
          hasFiles={files.length > 0}
        />
      )}

      {/* 파일 목록 */}
      <FileList
        files={files}
        isUploading={isUploading}
        onRemoveFile={removeFile}
      />
    </div>
  );
}