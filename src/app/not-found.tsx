'use client';

import { motion } from 'framer-motion';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-8"
      >
        {/* 404 아이콘 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="relative"
        >
          <div className="w-32 h-32 mx-auto bg-stone-800/50 rounded-full flex items-center justify-center">
            <FileQuestion className="w-16 h-16 text-stone-400" />
          </div>
          
          {/* 404 텍스트 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-stone-800 border border-stone-700/50 rounded-lg px-3 py-1"
          >
            <span className="text-2xl font-bold text-stone-300">404</span>
          </motion.div>
        </motion.div>

        {/* 메시지 */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white"
          >
            페이지를 찾을 수 없습니다
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-stone-400 leading-relaxed"
          >
            요청하신 페이지가 존재하지 않거나
            <br />
            이동되었을 수 있습니다.
          </motion.p>
        </div>

        {/* 추천 페이지들 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-stone-800/30 border border-stone-700/30 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-sm font-medium text-stone-300">
            이런 페이지는 어떠세요?
          </h3>
          
          <div className="space-y-2">
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 p-3 bg-stone-700/30 hover:bg-stone-600/30 rounded-xl transition-all duration-200 group"
              >
                <Home className="w-4 h-4 text-stone-400 group-hover:text-stone-300" />
                <span className="text-sm text-stone-300 group-hover:text-white">
                  홈 페이지
                </span>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* 액션 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history.back()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-800/50 hover:bg-stone-700/50 border border-stone-600/50 text-stone-300 font-medium rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </motion.button>

          <Link href="/" className="flex-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-3 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-xl transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              홈으로
            </motion.div>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-stone-500"
        >
          URL을 다시 확인해주세요
        </motion.p>
      </motion.div>
    </div>
  );
}