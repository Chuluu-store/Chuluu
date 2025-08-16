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
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        marginLeft: "-160px",
        zIndex: 50,
        pointerEvents: "none",
        width: "320px",
      }}
    >
      <div className="safe-bottom" style={{ pointerEvents: "auto" }}>
        <div
          style={{
            width: "100%",
            background: "rgba(41, 37, 36, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(120, 113, 108, 0.5)",
            borderRadius: "24px",
            padding: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
            }}
          >
            {/* 슬라이딩 배경 */}
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                background: "rgba(120, 113, 108, 1)",
                borderRadius: "14px",
                width: "calc(50% - 3px)",
              }}
              animate={{
                x: currentPage === "groups" ? "calc(100% + 6px)" : "0%",
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 40,
                mass: 1,
              }}
            />

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "12px 0",
                  borderRadius: "14px",
                  zIndex: 10,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: currentPage === item.id ? "#ffffff" : "#a8a29e",
                  fontWeight: currentPage === item.id ? "600" : "500",
                  transition: "all 0.2s ease",
                }}
              >
                <item.icon
                  className={`w-5 h-5 mb-1 transition-all duration-200 ${
                    currentPage === item.id
                      ? "text-white opacity-100"
                      : "text-stone-400 opacity-70"
                  }`}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: currentPage === item.id ? "600" : "500",
                    color: currentPage === item.id ? "#ffffff" : "#a8a29e",
                  }}
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