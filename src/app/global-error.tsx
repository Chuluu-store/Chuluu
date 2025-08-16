'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-stone-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg text-center space-y-8"
          >
            {/* 크리티컬 에러 아이콘 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-28 h-28 mx-auto bg-red-600/20 rounded-full flex items-center justify-center"
            >
              <div className="w-24 h-24 bg-red-600/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-14 h-14 text-red-400" />
              </div>
            </motion.div>

            {/* 에러 메시지 */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white"
              >
                심각한 오류
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-stone-300 leading-relaxed"
              >
                애플리케이션에 크리티컬한 오류가 발생했습니다.
                <br />
                페이지를 새로고침하거나 관리자에게 문의해주세요.
              </motion.p>

              {/* 개발 환경에서만 에러 상세 정보 표시 */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-6 bg-stone-800/50 border border-red-700/30 rounded-xl text-left"
                >
                  <p className="text-sm text-red-400 mb-3 font-medium">
                    개발 모드 - 글로벌 에러 정보:
                  </p>
                  <code className="text-sm text-red-300 break-all block">
                    {error.message}
                  </code>
                  {error.digest && (
                    <p className="text-xs text-stone-500 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
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
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  <RefreshCcw className="w-5 h-5" />
                  다시 시도
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-stone-700 hover:bg-stone-600 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  <Home className="w-5 h-5" />
                  홈으로
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-stone-800/30 border border-stone-700/30 rounded-xl p-4"
              >
                <p className="text-sm text-stone-400 mb-2">
                  문제가 계속 발생한다면:
                </p>
                <ul className="text-xs text-stone-500 space-y-1 text-left">
                  <li>• 브라우저 캐시를 삭제해보세요</li>
                  <li>• 다른 브라우저에서 시도해보세요</li>
                  <li>• 네트워크 연결을 확인해보세요</li>
                  <li>• 관리자에게 문의해주세요</li>
                </ul>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}