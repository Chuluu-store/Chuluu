'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: (data: any) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 회원가입 시 비밀번호 확인 검증
      if (isRegister && formData.password !== formData.confirmPassword) {
        throw new Error('비밀번호가 일치하지 않습니다');
      }

      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? {
            username: formData.name || formData.email.split('@')[0],
            email: formData.email,
            password: formData.password,
          }
        : { email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '오류가 발생했습니다');
      }

      // 토큰 저장
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto">
        {/* 심플한 헤더 */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-3"
          >
            {isRegister ? '회원가입' : '로그인'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-stone-400 text-base leading-relaxed"
          >
            {isRegister ? 'Chuluu에서 사진을 공유해보세요' : '계정에 로그인하여 계속하세요'}
          </motion.p>
        </div>

        {/* 메인 폼 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 이름 (회원가입시만) */}
            {isRegister && (
              <div className="space-y-4">
                <label className="block text-base font-medium text-stone-300 px-2">이름</label>
                <div className="flex items-center bg-stone-900/50 rounded-2xl p-1 focus-within:bg-stone-800/60 transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <User className="w-5 h-5 text-stone-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 bg-transparent px-3 py-4 text-white placeholder-stone-500 text-base focus:placeholder-stone-400 focus:outline-none border-none"
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>
              </div>
            )}

            {/* 이메일 */}
            <div className="space-y-4">
              <label className="block text-base font-medium text-stone-300 px-2">이메일</label>
              <div className="flex items-center bg-stone-900/50 rounded-2xl p-1 focus-within:bg-stone-800/60 transition-all duration-300">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-stone-500" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="flex-1 bg-transparent px-3 py-4 text-white placeholder-stone-500 text-base focus:placeholder-stone-400 focus:outline-none border-none"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-4">
              <label className="block text-base font-medium text-stone-300 px-2">비밀번호</label>
              <div className="flex items-center bg-stone-900/50 rounded-2xl p-1 focus-within:bg-stone-800/60 transition-all duration-300">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-stone-500" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 bg-transparent px-3 py-4 text-white placeholder-stone-500 text-base focus:placeholder-stone-400 focus:outline-none border-none"
                  placeholder="비밀번호를 입력하세요"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* 비밀번호 확인 (회원가입시만) */}
            {isRegister && (
              <div className="space-y-4">
                <label className="block text-base font-medium text-stone-300 px-2">비밀번호 확인</label>
                <div className="flex items-center bg-stone-900/50 rounded-2xl p-1 focus-within:bg-stone-800/60 transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-stone-500" />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="flex-1 bg-transparent px-3 py-4 text-white placeholder-stone-500 text-base focus:placeholder-stone-400 focus:outline-none border-none"
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 mx-2 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <p className="text-red-400 text-base">{error}</p>
              </motion.div>
            )}

            {/* 제출 버튼 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-stone-600 text-white font-semibold rounded-2xl hover:bg-stone-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-stone-400 border-t-white rounded-full animate-spin"></div>
                  <span>처리 중...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <span>{isRegister ? '계정 만들기' : '로그인'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </motion.button>
          </form>

          {/* 하단 전환 링크 */}
          <div className="mt-8 pt-6 border-t border-stone-700/50">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="w-full text-center text-stone-400 hover:text-white transition-colors text-sm py-3"
            >
              {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
