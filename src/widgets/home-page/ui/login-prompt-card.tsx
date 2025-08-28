'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LogIn as LogInIcon } from 'lucide-react';

interface LoginPromptCardProps {
  onLogin: () => void;
}

export function LoginPromptCard({ onLogin }: LoginPromptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-10 text-center overflow-hidden"
    >
      <div className="relative z-10 space-y-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-stone-600 to-stone-700 rounded-2xl flex items-center justify-center shadow-lg">
          <LogInIcon className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">로그인이 필요합니다</h2>
          <p className="text-lg text-stone-300 leading-relaxed max-w-sm mx-auto">
            <span className="text-stone-100 font-medium">Chuluu</span>에서 사진을 공유하고
            <br className="hidden sm:block" />
            추억을 함께 만들어보세요
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="w-full max-w-xs mx-auto py-3.5 bg-stone-600 text-white rounded-2xl font-semibold hover:bg-stone-500 transition-all shadow-lg hover:shadow-xl text-base border border-stone-500/50 hover:border-stone-400/50"
        >
          로그인 시작하기
        </motion.button>
      </div>
    </motion.div>
  );
}
