'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileImage, 
  FileVideo, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Pause,
  Play,
  XCircle
} from 'lucide-react';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  mediaId?: string;
}

interface BulkUploadProps {
  groupId: string;
  onUploadComplete?: (results: any) => void;
  onClose?: () => void;
}

export function BulkUpload({ groupId, onUploadComplete, onClose }: BulkUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState({
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
    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      id: `${file.name}_${file.size}_${Date.now()}_${Math.random()}`,
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
      const newFiles = prev.filter(f => f.id !== fileId);
      const totalSize = newFiles.reduce((sum, f) => sum + f.file.size, 0);
      setUploadStats(prevStats => ({
        ...prevStats,
        total: newFiles.length,
        totalSize
      }));
      return newFiles;
    });
  }, []);

  // 업로드 세션 생성
  const createUploadSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('인증이 필요합니다');

    const fileList = files.map(f => ({
      name: f.file.name,
      size: f.file.size,
      type: f.file.type
    }));

    const response = await fetch('/api/upload/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        groupId,
        files: fileList
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '세션 생성 실패');
    }

    return response.json();
  };

  // 개별 파일 업로드
  const uploadFile = async (uploadFile: UploadFile, fileIndex: number, signal: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('인증이 필요합니다');

    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('sessionId', sessionId!);
    formData.append('fileIndex', fileIndex.toString());

    // 파일 상태 업데이트
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));

    const response = await fetch('/api/upload/file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      signal
    });

    const result = await response.json();

    if (result.success) {
      // 성공
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, mediaId: result.mediaId }
          : f
      ));
      
      setUploadStats(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));
    } else {
      // 실패
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'failed', error: result.error }
          : f
      ));
      
      setUploadStats(prev => ({
        ...prev,
        failed: prev.failed + 1
      }));
    }

    return result;
  };

  // 전체 업로드 시작
  const startUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();

    try {
      // 1. 업로드 세션 생성
      const session = await createUploadSession();
      setSessionId(session.sessionId);
      
      setUploadStats(prev => ({
        ...prev,
        estimatedTime: session.estimatedTime,
        completed: 0,
        failed: 0
      }));

      // 2. 순차적으로 파일 업로드 (동시 업로드 수 제한)
      const concurrentLimit = 3; // 동시에 3개 파일까지 업로드
      const uploadPromises: Promise<any>[] = [];
      
      for (let i = 0; i < files.length; i += concurrentLimit) {
        if (isPaused || abortControllerRef.current?.signal.aborted) break;
        
        const batch = files.slice(i, i + concurrentLimit);
        const batchPromises = batch.map((file, batchIndex) => 
          uploadFile(file, i + batchIndex, abortControllerRef.current!.signal)
            .catch(error => ({ success: false, error: error.message, fileId: file.id }))
        );
        
        uploadPromises.push(...batchPromises);
        
        // 배치 완료 대기
        await Promise.allSettled(batchPromises);
        
        // 잠시 대기 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 모든 업로드 완료 대기
      const results = await Promise.allSettled(uploadPromises);
      
      console.log('업로드 완료:', results);
      onUploadComplete?.(results);

    } catch (error) {
      console.error('업로드 오류:', error);
      alert(`업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  // 업로드 일시정지/재시작
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 업로드 취소
  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setIsPaused(false);
    
    // 모든 파일 상태를 pending으로 리셋
    setFiles(prev => prev.map(f => ({
      ...f,
      status: 'pending',
      progress: 0,
      error: undefined
    })));
  };

  // 파일 타입별 아이콘
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-8 h-8 text-blue-400" />;
    } else if (file.type.startsWith('video/')) {
      return <FileVideo className="w-8 h-8 text-purple-400" />;
    }
    return <FileImage className="w-8 h-8 text-gray-400" />;
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 업로드 진행률 계산
  const overallProgress = uploadStats.total > 0 
    ? Math.round(((uploadStats.completed + uploadStats.failed) / uploadStats.total) * 100)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
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
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-stone-600 rounded-2xl p-12 text-center hover:border-stone-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            파일을 드래그하거나 클릭하여 선택
          </h3>
          <p className="text-stone-400 mb-4">
            최대 5000개 파일, 개별 파일당 500MB까지 지원
          </p>
          <p className="text-sm text-stone-500">
            지원 형식: JPG, PNG, GIF, WebP, HEIC, MP4, MOV, AVI, WebM
          </p>
        </div>
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
        <div className="bg-stone-900/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{uploadStats.total}</div>
                <div className="text-xs text-stone-400">총 파일</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{uploadStats.completed}</div>
                <div className="text-xs text-stone-400">완료</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{uploadStats.failed}</div>
                <div className="text-xs text-stone-400">실패</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{formatFileSize(uploadStats.totalSize)}</div>
                <div className="text-xs text-stone-400">총 용량</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isUploading ? (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
                  >
                    파일 추가
                  </button>
                  <button
                    onClick={startUpload}
                    disabled={files.length === 0}
                    className="px-6 py-2 bg-stone-700 hover:bg-stone-600 disabled:bg-stone-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    업로드 시작
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? '재시작' : '일시정지'}
                  </button>
                  <button
                    onClick={cancelUpload}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    취소
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 전체 진행률 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-300">전체 진행률</span>
                <span className="text-white">{overallProgress}%</span>
              </div>
              <div className="w-full bg-stone-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  className="bg-stone-500 h-2 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {files.map((uploadFile) => (
              <motion.div
                key={uploadFile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4 p-3 bg-stone-900/20 rounded-xl"
              >
                {/* 파일 아이콘 */}
                <div className="flex-shrink-0">
                  {getFileIcon(uploadFile.file)}
                </div>

                {/* 파일 정보 */}
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-white truncate">
                    {uploadFile.file.name}
                  </div>
                  <div className="text-sm text-stone-400">
                    {formatFileSize(uploadFile.file.size)}
                  </div>
                  
                  {/* 진행률 바 */}
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-stone-700 rounded-full h-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadFile.progress}%` }}
                          className="bg-stone-500 h-1 rounded-full"
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 에러 메시지 */}
                  {uploadFile.status === 'failed' && uploadFile.error && (
                    <div className="mt-1 text-xs text-red-400">
                      {uploadFile.error}
                    </div>
                  )}
                </div>

                {/* 상태 아이콘 */}
                <div className="flex-shrink-0">
                  {uploadFile.status === 'pending' && (
                    <div className="w-6 h-6 rounded-full bg-stone-600" />
                  )}
                  {uploadFile.status === 'uploading' && (
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  )}
                  {uploadFile.status === 'completed' && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                  {uploadFile.status === 'failed' && (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                </div>

                {/* 삭제 버튼 */}
                {!isUploading && (
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="flex-shrink-0 p-1 hover:bg-stone-700/30 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}