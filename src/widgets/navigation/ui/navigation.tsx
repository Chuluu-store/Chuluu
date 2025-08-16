"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Images, 
  FolderOpen
} from "lucide-react";

// 네비게이션 아이템 타입
interface NavItem {
  id: 'home' | 'groups';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 네비게이션 아이템들 - 심플하게 정리
const navItems: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Images
  },
  {
    id: 'groups',
    label: '내 그룹', 
    icon: FolderOpen
  }
];

interface NavigationProps {
  currentPage: 'home' | 'groups';
  onNavigate: (page: 'home' | 'groups') => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {

  return (
    <>
      {/* 모바일 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none md:hidden">
        <div className="safe-bottom pointer-events-auto">
          <div className="px-4 pb-6">
            <div className="w-full bg-stone-800/90 backdrop-blur-xl border border-stone-700/50 rounded-2xl p-3 shadow-2xl">
              <div className="relative grid grid-cols-2 gap-2">
                {/* 슬라이딩 배경 */}
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute top-0 bottom-0 bg-stone-600 rounded-xl"
                  initial={false}
                  animate={{
                    x: currentPage === 'groups' ? 'calc(100% + 8px)' : '0%'
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  style={{ width: 'calc(50% - 4px)' }}
                />
                
                {navItems.map((item) => (
                  <motion.button 
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      relative flex flex-col items-center py-4 rounded-xl transition-colors duration-200 z-10
                      ${currentPage === item.id 
                        ? 'text-white' 
                        : 'text-stone-400 hover:text-stone-300'
                      }
                    `}
                  >
                    <item.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 데스크탑 네비게이션 */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="safe-bottom pointer-events-auto">
          <div className="px-6 pb-6">
            <div className="max-w-md mx-auto bg-stone-800/90 backdrop-blur-xl border border-stone-700/50 rounded-2xl p-3 shadow-2xl">
              <div className="relative grid grid-cols-2 gap-2">
                {/* 슬라이딩 배경 */}
                <motion.div
                  layoutId="activeTabDesktop"
                  className="absolute top-0 bottom-0 bg-stone-600 rounded-xl"
                  initial={false}
                  animate={{
                    x: currentPage === 'groups' ? 'calc(100% + 8px)' : '0%'
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  style={{ width: 'calc(50% - 4px)' }}
                />
                
                {navItems.map((item) => (
                  <motion.button 
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      relative flex flex-col items-center py-4 rounded-xl transition-colors duration-200 z-10
                      ${currentPage === item.id 
                        ? 'text-white' 
                        : 'text-stone-400 hover:text-stone-300'
                      }
                    `}
                  >
                    <item.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}