'use client';

import React from 'react';
import { 
  Calendar,
  Upload,
  Camera,
  Filter,
  SlidersHorizontal,
  Image,
  Video,
  ArrowUpDown
} from 'lucide-react';

interface FilterOptions {
  sortBy: 'takenAt' | 'uploadedAt';
  order: 'desc' | 'asc';
  mediaType?: 'image' | 'video' | 'all';
  cameraMake?: string;
}

interface GalleryFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  cameraOptions?: string[];
}

export function GalleryFilter({ filters, onFilterChange, cameraOptions = [] }: GalleryFilterProps) {
  return (
    <div className="sticky top-20 z-10 bg-gradient-to-b from-stone-900 to-stone-900/95 backdrop-blur-xl border-b border-stone-700/30">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* 정렬 기준 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/80 rounded-xl border border-stone-700/50 hover:border-stone-600 transition-colors">
            {filters.sortBy === 'takenAt' ? (
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-stone-400" />
            )}
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as 'takenAt' | 'uploadedAt' })}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer pr-1"
            >
              <option value="takenAt">촬영 날짜</option>
              <option value="uploadedAt">업로드 날짜</option>
            </select>
          </div>

          {/* 정렬 순서 */}
          <button
            onClick={() => onFilterChange({ ...filters, order: filters.order === 'desc' ? 'asc' : 'desc' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/80 rounded-xl border border-stone-700/50 hover:border-stone-600 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-white text-sm">
              {filters.order === 'desc' ? '최신순' : '오래된순'}
            </span>
          </button>

          {/* 미디어 타입 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFilterChange({ ...filters, mediaType: undefined })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                !filters.mediaType 
                  ? 'bg-stone-700 border-stone-600 text-white' 
                  : 'bg-stone-800/80 border-stone-700/50 text-stone-400 hover:border-stone-600'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="text-sm">전체</span>
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, mediaType: 'image' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                filters.mediaType === 'image' 
                  ? 'bg-stone-700 border-stone-600 text-white' 
                  : 'bg-stone-800/80 border-stone-700/50 text-stone-400 hover:border-stone-600'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span className="text-sm">사진</span>
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, mediaType: 'video' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                filters.mediaType === 'video' 
                  ? 'bg-stone-700 border-stone-600 text-white' 
                  : 'bg-stone-800/80 border-stone-700/50 text-stone-400 hover:border-stone-600'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="text-sm">동영상</span>
            </button>
          </div>

          {/* 카메라 기종 필터 (옵션이 있을 때만 표시) */}
          {cameraOptions.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/80 rounded-xl border border-stone-700/50 hover:border-stone-600 transition-colors">
              <Camera className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={filters.cameraMake || 'all'}
                onChange={(e) => onFilterChange({ ...filters, cameraMake: e.target.value === 'all' ? undefined : e.target.value })}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">모든 기종</option>
                {cameraOptions.map(camera => (
                  <option key={camera} value={camera}>{camera}</option>
                ))}
              </select>
            </div>
          )}

          {/* 필터 요약 */}
          {(filters.mediaType || filters.cameraMake) && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-700/30 rounded-lg">
              <SlidersHorizontal className="w-3 h-3 text-stone-500" />
              <span className="text-xs text-stone-400">
                {[
                  filters.mediaType === 'image' && '사진',
                  filters.mediaType === 'video' && '동영상',
                  filters.cameraMake
                ].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}