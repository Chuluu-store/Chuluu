'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LoginForm } from '../../../features/auth/ui/login-form';
import { GroupModal } from '../../../features/group/ui/group-modal';
import { LoginPrompt } from '../../../features/auth/ui/login-prompt';
import { GroupsHero } from './groups-hero';
import { GroupsList } from './groups-list';
import { EmptyGroupsState } from './empty-groups-state';
import { type Group } from '../../../entities/group/model/types';

export function GroupsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupModal, setGroupModal] = useState<{
    isOpen: boolean;
    type: 'create' | 'join';
  }>({
    isOpen: false,
    type: 'create',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsLoggedIn(true);
      fetchUserGroups();
    }
  }, []);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/groups', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('그룹 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setIsLoggedIn(true);
    window.location.reload();
  };

  const openGroupModal = (type: 'create' | 'join') => {
    if (!isLoggedIn) {
      setShowLogin(true);
    } else {
      setGroupModal({ isOpen: true, type });
    }
  };

  const handleGroupClick = (group: Group) => {
    console.log('그룹 선택:', group);
    router.push(`/group/${group.id}`);
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full">
        <div className="px-8 py-16 pb-24">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <GroupsHero title="내 그룹" subtitle="로그인하여 그룹을 관리하세요" />

            {showLogin ? (
              <LoginForm onSuccess={handleLoginSuccess} />
            ) : (
              <LoginPrompt onLogin={() => setShowLogin(true)} />
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-8 py-8 pb-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* 간단한 헤더 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">내 그룹</h1>
            <p className="text-stone-400 text-sm">참여 중인 그룹을 확인하고 관리하세요</p>
          </motion.div>

          {groups.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <EmptyGroupsState
                onCreateGroup={() => openGroupModal('create')}
                onJoinGroup={() => openGroupModal('join')}
              />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GroupsList
                groups={groups}
                onCreateGroup={() => openGroupModal('create')}
                onJoinGroup={() => openGroupModal('join')}
                onGroupClick={handleGroupClick}
              />
            </motion.div>
          )}

          <GroupModal
            isOpen={groupModal.isOpen}
            onClose={() => setGroupModal({ ...groupModal, isOpen: false })}
            type={groupModal.type}
          />
        </motion.div>
      </div>
    </div>
  );
}
