'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut } from 'lucide-react';

export function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsLoggedIn(true);
      const userData = JSON.parse(user);
      setUsername(userData.username || '');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-md mx-auto">
      <div className="safe-top bg-stone-800/70 backdrop-blur-xl border-b border-stone-600/20 shadow-lg">
        <div className="px-8">
          <div className="flex items-center justify-between h-20">
            {/* 로고 섹션 */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <Image src="/logo.png" alt="Chuluu Logo" width={40} height={40} className="rounded-xl" />
              </div>
              <h1 className="text-xl font-semibold text-white">Chuluu</h1>
            </Link>

            {/* 사용자 프로필 */}
            <div className="flex items-center">
              {isLoggedIn && (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-stone-700/50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm text-white font-medium">{username.charAt(0).toUpperCase()}</span>
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
          </div>
        </div>
      </div>
    </header>
  );
}
