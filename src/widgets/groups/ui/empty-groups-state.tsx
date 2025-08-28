'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, LogIn as LogInIcon } from 'lucide-react';

interface EmptyGroupsStateProps {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

export function EmptyGroupsState({ onCreateGroup, onJoinGroup }: EmptyGroupsStateProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-16">
      <div className="bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl px-16 py-20 text-center">
        <p className="text-lg text-stone-400 mt-4">아직 참여한 그룹이 없습니다</p>
        <p className="text-base text-stone-500 mt-2">새 그룹을 만들거나 초대 코드로 그룹에 참여해보세요</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateGroup}
          className="group relative bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-8 cursor-pointer hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300 overflow-hidden"
        >
          <div className="relative z-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-stone-700 rounded-2xl flex items-center justify-center group-hover:bg-stone-600 group-hover:scale-110 transition-all duration-300">
              <Plus className="w-8 h-8 text-stone-200" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-stone-200 transition-colors">
                그룹 생성
              </h3>
              <p className="text-stone-400 leading-relaxed">새로운 그룹을 만들어보세요</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onJoinGroup}
          className="group relative bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-8 cursor-pointer hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300 overflow-hidden"
        >
          <div className="relative z-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-stone-700 rounded-2xl flex items-center justify-center group-hover:bg-stone-600 group-hover:scale-110 transition-all duration-300">
              <LogInIcon className="w-8 h-8 text-stone-200" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-stone-200 transition-colors">
                그룹 참가
              </h3>
              <p className="text-stone-400 leading-relaxed">초대 코드로 참여하세요</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
