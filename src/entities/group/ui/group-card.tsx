"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Calendar, Image as ImageIcon } from "lucide-react";

import { Group } from "../model/types";

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-6 sm:p-8 lg:p-10 cursor-pointer hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-6 sm:mb-8">
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-medium text-white mb-2 sm:mb-3">
            {group.name}
          </h3>
          {group.description && (
            <p className="text-sm sm:text-base text-stone-400 mb-3 sm:mb-4 leading-relaxed">
              {group.description}
            </p>
          )}
        </div>
        <div className="p-3 sm:p-4 rounded-2xl bg-stone-700/50">
          <Users className="w-6 sm:w-7 h-6 sm:h-7 text-stone-300" />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm sm:text-base text-stone-400">
        <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Users className="w-4 sm:w-5 h-4 sm:h-5" />
            <span>{group.memberCount}</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <ImageIcon className="w-4 sm:w-5 h-4 sm:h-5" />
            <span>{group.mediaCount}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
          <span className="text-xs sm:text-sm">
            {new Date(group.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
