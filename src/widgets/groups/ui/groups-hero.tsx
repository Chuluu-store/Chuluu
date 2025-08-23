"use client";

import React from "react";
import { motion } from "framer-motion";

interface GroupsHeroProps {
  title: string;
  subtitle: string;
}

export function GroupsHero({ title, subtitle }: GroupsHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="relative">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          {title}
        </h1>
        <div className="w-16 h-1 bg-stone-500 mx-auto rounded-full"></div>
      </div>
      <p className="text-xl text-stone-300 leading-relaxed max-w-xl mx-auto">
        {subtitle}
      </p>
    </motion.div>
  );
}
