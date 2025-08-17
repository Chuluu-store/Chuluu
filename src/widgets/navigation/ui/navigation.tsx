"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Images, FolderOpen } from "lucide-react";

// 네비게이션 아이템 타입
interface NavItem {
  id: "home" | "groups";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 네비게이션 아이템들 - 심플하게 정리
const navItems: NavItem[] = [
  {
    id: "home",
    label: "홈",
    icon: Images,
  },
  {
    id: "groups",
    label: "내 그룹",
    icon: FolderOpen,
  },
];

interface NavigationProps {
  currentPage: "home" | "groups";
  onNavigate: (page: "home" | "groups") => void;
}

export const Navigation = memo(function Navigation({
  currentPage,
  onNavigate,
}: NavigationProps) {
  console.log("Navigation rendered with currentPage:", currentPage);

  const handleNavClick = (page: "home" | "groups") => {
    console.log(
      "Nav button clicked:",
      page,
      "- Current page was:",
      currentPage
    );
    onNavigate(page);
  };

  return (
    <div className="sticky bottom-0 z-50 w-full pb-5 pt-2">
      <div className="max-w-xs mx-auto px-4">
        <div className="bg-stone-800/90 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-3 shadow-2xl">
          <div className="relative grid grid-cols-2 gap-1.5">
            {/* 슬라이딩 배경 */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-stone-700 rounded-2xl will-change-transform"
              style={{
                width: "calc(50% - 3px)",
                transform: "translateZ(0)",
              }}
              animate={{
                x: currentPage === "groups" ? "calc(100% + 6px)" : "0%",
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
                mass: 0.8,
              }}
            />

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="relative z-10 flex flex-col items-center py-3 rounded-2xl bg-transparent border-none cursor-pointer transition-all duration-200"
              >
                <item.icon
                  className={`w-5 h-5 mb-1 transition-all duration-200 ${
                    currentPage === item.id
                      ? "text-white opacity-100"
                      : "text-stone-400 opacity-70"
                  }`}
                />
                <span
                  className={`text-xs transition-all duration-200 ${
                    currentPage === item.id
                      ? "text-white font-semibold"
                      : "text-stone-400 font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});