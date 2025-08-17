import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Play, Pause, XCircle } from 'lucide-react';
import { UploadStats as IUploadStats } from '../model/upload-types';
import { formatFileSize } from '../lib/upload-utils';

interface UploadStatsProps {
  stats: IUploadStats;
  isUploading: boolean;
  isPaused: boolean;
  overallProgress: number;
  onAddFiles: () => void;
  onStartUpload: () => void;
  onTogglePause: () => void;
  onCancelUpload: () => void;
  hasFiles: boolean;
}

export function UploadStats({
  stats,
  isUploading,
  isPaused,
  overallProgress,
  onAddFiles,
  onStartUpload,
  onTogglePause,
  onCancelUpload,
  hasFiles
}: UploadStatsProps) {
  return (
    <div className="bg-stone-900/30 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-6 space-y-6">
      {/* 통계 섹션 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/40 rounded-2xl p-4 text-center group hover:bg-stone-800/80 transition-all duration-300"
        >
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.total}</div>
          <div className="text-xs text-stone-400 font-medium">총 파일</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/40 rounded-2xl p-4 text-center group hover:bg-stone-800/80 transition-all duration-300"
        >
          <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">{stats.completed}</div>
          <div className="text-xs text-stone-400 font-medium">완료</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/40 rounded-2xl p-4 text-center group hover:bg-stone-800/80 transition-all duration-300"
        >
          <div className="text-2xl md:text-3xl font-bold text-red-400 mb-1">{stats.failed}</div>
          <div className="text-xs text-stone-400 font-medium">실패</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/40 rounded-2xl p-4 text-center group hover:bg-stone-800/80 transition-all duration-300"
        >
          <div className="text-lg md:text-xl font-bold text-white mb-1">{formatFileSize(stats.totalSize)}</div>
          <div className="text-xs text-stone-400 font-medium">총 용량</div>
        </motion.div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {!isUploading ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddFiles}
              className="flex items-center gap-2 px-5 py-3 bg-stone-700 hover:bg-stone-600 border border-stone-600/50 text-white rounded-xl transition-all duration-200 shadow-lg"
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium">파일 추가</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartUpload}
              disabled={!hasFiles}
              className="flex items-center gap-2 px-6 py-3 bg-stone-600 hover:bg-stone-500 disabled:bg-stone-700 disabled:cursor-not-allowed border border-stone-500/50 disabled:border-stone-600/50 text-white rounded-xl transition-all duration-200 shadow-lg font-semibold"
            >
              <Play className="w-4 h-4" />
              <span>업로드 시작</span>
            </motion.button>
          </>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onTogglePause}
              className="flex items-center gap-2 px-5 py-3 bg-yellow-600 hover:bg-yellow-500 border border-yellow-500/50 text-white rounded-xl transition-all duration-200 shadow-lg"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="font-medium">{isPaused ? '재시작' : '일시정지'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancelUpload}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 border border-red-500/50 text-white rounded-xl transition-all duration-200 shadow-lg"
            >
              <XCircle className="w-4 h-4" />
              <span className="font-medium">취소</span>
            </motion.button>
          </>
        )}
      </div>

      {/* 전체 진행률 */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-stone-300 font-medium">전체 진행률</span>
            <span className="text-white font-semibold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-stone-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              className="bg-gradient-to-r from-stone-500 to-stone-400 h-3 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}