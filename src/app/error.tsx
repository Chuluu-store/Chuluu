'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-8"
      >
        {/* 에러 아이콘 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 mx-auto bg-red-600/20 rounded-full flex items-center justify-center"
        >
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </motion.div>

        {/* 에러 메시지 */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white"
          >
            문제가 발생했습니다
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-stone-400 leading-relaxed"
          >
            예상치 못한 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해주세요.
          </motion.p>

          {/* 개발 환경에서만 에러 상세 정보 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-stone-800/50 border border-stone-700/50 rounded-xl text-left"
            >
              <p className="text-xs text-stone-500 mb-2">개발 모드 - 에러 정보:</p>
              <code className="text-xs text-red-400 break-all">
                {error.message}
              </code>
            </motion.div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-xl transition-all duration-200"
            >
              <RefreshCcw className="w-4 h-4" />
              다시 시도
            </motion.button>

            <Link href="/" className="flex-1">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 py-3 bg-stone-800/50 hover:bg-stone-700/50 border border-stone-600/50 text-stone-300 font-medium rounded-xl transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                홈으로
              </motion.div>
            </Link>
          </div>

          <p className="text-xs text-stone-500">
            문제가 계속되면 관리자에게 문의해주세요
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}