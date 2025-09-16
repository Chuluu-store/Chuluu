'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GroupsHeroProps {
  title: string;
  subtitle: string;
}

export function GroupsHero({ title, subtitle }: GroupsHeroProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
      <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
      <p className="text-lg text-stone-400 max-w-xl mx-auto">{subtitle}</p>
    </motion.div>
  );
}
