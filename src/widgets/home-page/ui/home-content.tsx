'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '@/features/auth/ui/login-form';
import { UserDashboard } from '../../user-dashboard';
import { LoginPromptCard } from './login-prompt-card';

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
  if (showLogin) {
    return (
      <div className="w-full">
        <div className="px-8 py-16 pb-24">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* 미니멀한 로고 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Chuluu</h1>
              <p className="text-stone-400 text-sm">추억을 함께 쌓아가는 공간</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <LoginForm onSuccess={onLoginSuccess} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
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

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <LoginPromptCard onLogin={onShowLogin} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 로그인된 사용자를 위한 홈페이지
  return (
    <div className="w-full">
      <div className="px-8 py-8 pb-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* 웰컴 헤더 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">Chuluu</h1>
            <p className="text-lg text-stone-300 max-w-lg mx-auto">
              원본 품질로 추억을 공유하고, 언제든 다운로드할 수 있는 사진 공유 플랫폼
            </p>
          </motion.div>
          
          {/* 메인 컨텐츠 - 그룹 유무에 따라 다르게 표시 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <UserDashboard onOpenGroupModal={onOpenGroupModal} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
