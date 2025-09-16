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
    <div className="space-y-8">
      {/* 액션 버튼들 */}
      <div className="flex gap-3">
        <button
          onClick={onCreateGroup}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">새 그룹 생성</span>
        </button>
        <button
          onClick={onJoinGroup}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-stone-600 hover:bg-stone-500 text-white rounded-xl transition-colors"
        >
          <LogInIcon className="w-5 h-5" />
          <span className="font-medium">그룹 참가</span>
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-stone-800/30 border-2 border-dashed border-stone-600 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-stone-700/50 rounded-2xl flex items-center justify-center">
          <Plus className="w-8 h-8 text-stone-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">아직 참여한 그룹이 없어요</h3>
        <p className="text-stone-400 leading-relaxed max-w-md mx-auto">
          새 그룹을 만들거나 초대 코드를 사용해서 기존 그룹에 참여해보세요.
          <br />
          친구들과 함께 추억을 공유할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
