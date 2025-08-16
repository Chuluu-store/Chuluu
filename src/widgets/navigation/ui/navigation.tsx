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
  console.log('Navigation currentPage:', currentPage);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'none'
      }}
    >
      <div className="safe-bottom" style={{ pointerEvents: 'auto' }}>
        <div style={{ paddingBottom: '20px' }}>
          <div 
            style={{
              width: '320px',
              background: 'rgba(41, 37, 36, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(120, 113, 108, 0.5)',
              borderRadius: '24px',
              padding: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {/* 슬라이딩 배경 */}
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  background: 'rgba(87, 83, 78, 1)',
                  borderRadius: '14px',
                  width: 'calc(50% - 3px)'
                }}
                initial={false}
                animate={{
                  x: currentPage === 'groups' ? 'calc(100% + 6px)' : '0%'
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              />
              
              {navItems.map((item) => (
                <motion.button 
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderRadius: '14px',
                    transition: 'all 0.2s',
                    zIndex: 10,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: currentPage === item.id ? '#ffffff' : '#a8a29e'
                  }}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span style={{ fontSize: '11px', fontWeight: '500' }}>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}