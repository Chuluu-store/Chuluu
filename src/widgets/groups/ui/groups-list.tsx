'use client';

import React from 'react';
import { Plus, UserPlus } from 'lucide-react';

import { GroupCard, type Group } from '../../../entities/group';

interface GroupsListProps {
  groups: Group[];
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onGroupClick: (group: Group) => void;
}

export function GroupsList({ groups, onCreateGroup, onJoinGroup, onGroupClick }: GroupsListProps) {
  return (
    <div className="space-y-6">
      {/* 액션 버튼들 */}
      <div className="flex gap-3">
        <button
          onClick={onCreateGroup}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>새 그룹 생성</span>
        </button>
        <button
          onClick={onJoinGroup}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-stone-600 hover:bg-stone-500 text-white rounded-xl transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>그룹 참가</span>
        </button>
      </div>

      {/* 그룹 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">내 그룹 ({groups.length})</h3>
        </div>
        
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onClick={() => onGroupClick(group)} />
          ))}
        </div>
      </div>
    </div>
  );
}
