'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '../../header';

interface AlbumPageProps {
  albumId: string;
}

export function AlbumPage({ albumId }: AlbumPageProps) {
  return (
    <div className="min-h-screen stone-texture">
      <Header />

      <main className="pb-32 safe-bottom">
        <div className="px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="glass-card p-6 rounded-3xl">
              <h1 className="text-2xl font-bold text-white">Album: {albumId}</h1>
              <p className="text-gray-400 text-sm mt-2">앨범 상세 페이지 (구현 예정)</p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
