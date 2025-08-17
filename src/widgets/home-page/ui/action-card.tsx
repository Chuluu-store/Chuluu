"use client";

import React from "react";
import { motion } from "framer-motion";

interface ActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: ActionCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-8 cursor-pointer hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300 overflow-hidden"
    >
      <div className="relative z-10 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-stone-700 rounded-2xl flex items-center justify-center group-hover:bg-stone-600 group-hover:scale-110 transition-all duration-300">
          <Icon className="w-8 h-8 text-stone-200" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-stone-200 transition-colors">
            {title}
          </h3>
          <p className="text-stone-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}