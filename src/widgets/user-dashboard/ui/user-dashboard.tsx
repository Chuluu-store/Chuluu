'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Camera, ImageIcon } from 'lucide-react';

interface Member {
  id: string;
  username: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  mediaCount?: number;
  lastActivity?: string;
  inviteCode: string;
  isOwner: boolean;
  members?: Member[];
}

interface UserDashboardProps {
  onOpenGroupModal: (type: 'create' | 'join') => void;
}

export function UserDashboard({ onOpenGroupModal }: UserDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalGroups: 0, totalMedia: 0, totalMembers: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/groups', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // 통계 계산
        const totalMedia = data.groups?.reduce((sum: number, group: Group) => sum + (group.mediaCount || 0), 0) || 0;
        const totalMembers = data.groups?.reduce((sum: number, group: Group) => sum + group.memberCount, 0) || 0;
        
        setStats({
          totalGroups: data.groups?.length || 0,
          totalMedia,
          totalMembers,
        });
      }
    } catch (error) {
      console.error('통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-stone-800/50 rounded-2xl p-4 animate-pulse">
              <div className="w-8 h-8 bg-stone-700 rounded-lg mb-3"></div>
              <div className="w-12 h-6 bg-stone-700 rounded mb-1"></div>
              <div className="w-16 h-4 bg-stone-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-stone-800/50 rounded-2xl p-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="w-32 h-5 bg-stone-700 rounded mb-2"></div>
                  <div className="w-24 h-4 bg-stone-700 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-stone-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats.totalGroups === 0) {
    // 그룹이 없는 사용자를 위한 UI
    return (
      <div className="space-y-8">
        {/* 서비스 소개 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-stone-800/30 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-stone-700/50 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-stone-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">첫 번째 그룹을 만들어보세요</h3>
          <p className="text-stone-400 leading-relaxed max-w-md mx-auto mb-6">
            친구들과 함께 추억을 공유할 수 있는 그룹을 만들거나,
            <br />
            초대 코드를 사용해서 기존 그룹에 참여해보세요.
          </p>
          
          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <button
              onClick={() => onOpenGroupModal('create')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>그룹 생성</span>
            </button>
            <button
              onClick={() => onOpenGroupModal('join')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-stone-600 hover:bg-stone-500 text-white rounded-xl transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>그룹 참가</span>
            </button>
          </div>
        </motion.div>

        {/* 특징 소개 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-stone-700/50 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-stone-300" />
            </div>
            <h4 className="text-sm font-medium text-white mb-1">원본 품질</h4>
            <p className="text-xs text-stone-400">압축 없이 원본 그대로</p>
          </div>
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-stone-700/50 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-stone-300" />
            </div>
            <h4 className="text-sm font-medium text-white mb-1">무제한 업로드</h4>
            <p className="text-xs text-stone-400">용량 제한 없이 자유롭게</p>
          </div>
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-stone-700/50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-stone-300" />
            </div>
            <h4 className="text-sm font-medium text-white mb-1">쉬운 공유</h4>
            <p className="text-xs text-stone-400">초대 코드로 간편하게</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 그룹이 있는 사용자를 위한 UI
  return (
    <div className="space-y-6">
      {/* 내 그룹 간략 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">내 활동 요약</h3>
          <span className="text-sm text-stone-400">전체 {stats.totalGroups}개 그룹 참여 중</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{stats.totalGroups}</div>
            <div className="text-xs text-stone-400">참여 그룹</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{stats.totalMedia}</div>
            <div className="text-xs text-stone-400">전체 사진</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{stats.totalMembers}</div>
            <div className="text-xs text-stone-400">함께하는 멤버</div>
          </div>
        </div>
      </motion.div>

      {/* 안내 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-stone-800/30 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-6 text-center"
      >
        <h4 className="text-lg font-medium text-white mb-2">더 많은 기능을 사용해보세요</h4>
        <p className="text-stone-400 text-sm mb-4">
          '내 그룹' 탭에서 그룹별 사진을 확인하고 새로운 사진을 업로드해보세요
        </p>
        <div className="flex gap-2 justify-center">
          <span className="px-3 py-1 bg-stone-700/50 border border-stone-600/50 rounded-lg text-stone-200 text-xs">
            사진 업로드
          </span>
          <span className="px-3 py-1 bg-stone-700/50 border border-stone-600/50 rounded-lg text-stone-200 text-xs">
            멤버 초대
          </span>
          <span className="px-3 py-1 bg-stone-700/50 border border-stone-600/50 rounded-lg text-stone-200 text-xs">
            일괄 다운로드
          </span>
        </div>
      </motion.div>
    </div>
  );
}