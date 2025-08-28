'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface CreateGroupCardProps {
  onClick: () => void;
}

export function CreateGroupCard({ onClick }: CreateGroupCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 border-dashed rounded-3xl p-6 sm:p-8 lg:p-10 cursor-pointer hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300 overflow-hidden"
    >
      <div className="flex flex-col items-center justify-center text-center py-8 sm:py-10">
        <div className="w-16 h-16 mx-auto bg-stone-700 rounded-2xl flex items-center justify-center group-hover:bg-stone-600 group-hover:scale-110 transition-all duration-300 mb-6 sm:mb-8">
          <Plus className="w-8 sm:w-10 h-8 sm:h-10 text-stone-200" />
        </div>
        <h3 className="text-lg sm:text-xl font-medium text-white mb-3 sm:mb-4 group-hover:text-stone-200 transition-colors">
          새 그룹 만들기
        </h3>
        <p className="text-sm sm:text-base text-stone-400 leading-relaxed">친구들과 사진을 공유하세요</p>
      </div>
    </motion.div>
  );
}
