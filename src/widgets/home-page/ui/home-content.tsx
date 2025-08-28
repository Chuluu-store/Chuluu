'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '@/features/auth/ui/login-form';
import { MediaGridWidget } from '../../media-grid';
import { ActionCard } from './action-card';
import { LoginPromptCard } from './login-prompt-card';
import { Plus, LogIn as LogInIcon } from 'lucide-react';

interface HomeContentProps {
  isLoggedIn: boolean;
  showLogin: boolean;
  onLoginSuccess: () => void;
  onOpenGroupModal: (type: 'create' | 'join') => void;
  onShowLogin: () => void;
}

export function HomeContent({
  isLoggedIn,
  showLogin,
  onLoginSuccess,
  onOpenGroupModal,
  onShowLogin,
}: HomeContentProps) {
  return (
    <div className="w-full">
      <div className="px-8 py-16 pb-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <div className="relative">
              <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Chuluu</h1>
              <div className="w-16 h-1 bg-stone-500 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-6">
              <p className="text-xl text-stone-300 leading-relaxed max-w-xl mx-auto">
                <span className="text-stone-100 font-medium">Chuluu(촐로)</span>는 몽골어로{' '}
                <span className="text-stone-200">돌탑</span>이라는 뜻입니다.
                <br className="hidden sm:block" />
                당신의 추억을 하나하나 마치 돌탑처럼
                <br className="hidden sm:block" />
                당신의 지인들과 쌓아주세요.
              </p>

              <div className="space-y-4">
                <p className="text-lg text-stone-300 leading-relaxed max-w-xl mx-auto">
                  Chuluu는 마치 원석처럼 원본 상태 그대로 있습니다.
                  <br className="hidden sm:block" />
                  마음대로 사진을 공유하고, 추억을 함께 만들어가세요.
                </p>
                <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
                  <div className="text-center">
                    <span className="block px-1.5 py-1.5 bg-stone-700/50 border border-stone-600/50 rounded-lg text-stone-100 font-medium text-xs leading-tight">
                      원본 품질
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block px-1.5 py-1.5 bg-stone-700/50 border border-stone-600/50 rounded-lg text-stone-100 font-medium text-xs leading-tight">
                      무제한 업로드
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block px-1.5 py-1.5 bg-stone-700/50 border border-stone-600/50 rounded-lg text-stone-100 font-medium text-xs leading-tight">
                      쉬운 공유
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 로그인 상태에 따른 컨텐츠 */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {showLogin ? (
              <LoginForm onSuccess={onLoginSuccess} />
            ) : !isLoggedIn ? (
              <LoginPromptCard onLogin={onShowLogin} />
            ) : (
              <div className="space-y-12">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-3">시작하기</h2>
                  <p className="text-stone-400">원하는 작업을 선택해주세요</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ActionCard
                    icon={Plus}
                    title="그룹 생성"
                    description="새로운 그룹을 만들고 친구들을 초대하세요"
                    onClick={() => onOpenGroupModal('create')}
                  />
                  <ActionCard
                    icon={LogInIcon}
                    title="그룹 참가"
                    description="초대 코드로 기존 그룹에 참여하세요"
                    onClick={() => onOpenGroupModal('join')}
                  />
                </div>

                <div className="mt-12">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">내가 최근 업로드한 사진</h3>
                    <p className="text-stone-400">최근에 올린 사진들을 한눈에 확인하세요</p>
                  </div>
                  <MediaGridWidget />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
