"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      setIsLoggedIn(true);
      const userData = JSON.parse(user);
      setUsername(userData.username || "");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-600/20 bg-stone-800/70 backdrop-blur-xl shadow-lg">
      <div className="safe-top">
        <div className="px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 섹션 */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-stone-700 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h1 className="text-xl font-semibold text-white">Chuluu</h1>
            </Link>

            {/* 데스크톱 액션 바 */}
            <div className="hidden lg:flex items-center">
              {isLoggedIn && (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-stone-700/50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm text-white font-medium">
                        {username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-stone-200 font-medium">{username}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-stone-800/95 backdrop-blur-xl border border-stone-600/30 rounded-xl shadow-2xl py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm text-stone-200 hover:bg-stone-700/50 transition-all flex items-center space-x-3"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>로그아웃</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button
              className="lg:hidden p-3 rounded-xl hover:bg-stone-700/50 transition-all"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-stone-300" />
              ) : (
                <Menu className="w-5 h-5 text-stone-300" />
              )}
            </button>
          </div>

          {/* 모바일 메뉴 */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="py-6 space-y-3 border-t border-stone-600/20 mt-4">
                  {isLoggedIn ? (
                    <>
                      <div className="px-6 py-2 text-sm text-stone-300 font-medium">
                        {username}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-6 py-4 rounded-xl text-left flex items-center space-x-4 hover:bg-stone-700/30 transition-all"
                      >
                        <LogOut className="w-5 h-5 text-stone-400" />
                        <span className="text-stone-200">로그아웃</span>
                      </button>
                    </>
                  ) : (
                    <div className="px-6 py-2 text-sm text-stone-400">
                      로그인이 필요합니다
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
