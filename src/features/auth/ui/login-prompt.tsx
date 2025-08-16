"use client";

import React from "react";
import { motion } from "framer-motion";
import { LogIn as LogInIcon } from "lucide-react";

interface LoginPromptProps {
  onLogin: () => void;
}

export function LoginPrompt({ onLogin }: LoginPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-12 text-center overflow-hidden"
    >
      <div className="relative z-10 space-y-8">
        <div className="w-20 h-20 mx-auto bg-stone-700 rounded-full flex items-center justify-center mb-6">
          <LogInIcon className="w-10 h-10 text-stone-200" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">
            로그인이 필요합니다
          </h2>
          <p className="text-xl text-stone-300 leading-relaxed max-w-md mx-auto">
            그룹을 생성하고 관리하려면 로그인해주세요
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogin}
          className="w-full max-w-sm mx-auto py-4 bg-stone-700 text-white rounded-2xl font-semibold hover:bg-stone-600 transition-all shadow-lg hover:shadow-xl text-lg"
        >
          로그인 시작하기
        </motion.button>
      </div>
    </motion.div>
  );
}