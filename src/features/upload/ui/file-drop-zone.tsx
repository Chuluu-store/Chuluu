import React from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onClick: () => void;
}

export function FileDropZone({ onDrop, onDragOver, onClick }: FileDropZoneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="border-2 border-dashed border-stone-600 hover:border-stone-500 rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
    >
      <motion.div
        className="w-20 h-20 mx-auto mb-6 bg-stone-800/50 rounded-2xl flex items-center justify-center group-hover:bg-stone-700/50 transition-colors duration-300"
        whileHover={{ rotate: 5 }}
      >
        <Upload className="w-10 h-10 text-stone-400 group-hover:text-stone-300 transition-colors" />
      </motion.div>
      
      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-stone-200 transition-colors">
        파일을 드래그하거나 클릭하여 선택
      </h3>
      
      <p className="text-stone-400 mb-4 text-lg">
        최대 <span className="text-white font-semibold">5000개</span> 파일, 개별 파일당 <span className="text-white font-semibold">500MB</span>까지 지원
      </p>
      
      <p className="text-sm text-stone-500">
        지원 형식: <span className="text-stone-400">JPG, PNG, GIF, WebP, HEIC, MP4, MOV, AVI, WebM</span>
      </p>
    </motion.div>
  );
}