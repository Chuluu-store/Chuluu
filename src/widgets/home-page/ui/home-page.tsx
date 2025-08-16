"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "../../header";
import { MediaGridWidget } from "../../media-grid";
import { Navigation } from "../../navigation";
import { GroupsPage } from "../../groups";
import { LoginForm } from "@/features/auth/ui/login-form";
import { GroupModal } from "@/features/group/ui/group-modal";
import { Plus, LogIn as LogInIcon } from "lucide-react";

// 그룹 액션 카드
const ActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
}) => (
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

// 로그인 요구 카드
const LoginPrompt = ({ onLogin }: { onLogin: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-10 text-center overflow-hidden"
  >
    <div className="relative z-10 space-y-6">
      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-stone-600 to-stone-700 rounded-2xl flex items-center justify-center shadow-lg">
        <LogInIcon className="w-8 h-8 text-white" />
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-white">로그인이 필요합니다</h2>
        <p className="text-lg text-stone-300 leading-relaxed max-w-sm mx-auto">
          <span className="text-stone-100 font-medium">Chuluu</span>에서 사진을
          공유하고
          <br className="hidden sm:block" />
          추억을 함께 만들어보세요
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogin}
        className="w-full max-w-xs mx-auto py-3.5 bg-stone-600 text-white rounded-2xl font-semibold hover:bg-stone-500 transition-all shadow-lg hover:shadow-xl text-base border border-stone-500/50 hover:border-stone-400/50"
      >
        로그인 시작하기
      </motion.button>
    </div>
  </motion.div>
);

export function HomePage() {
  const [currentPage, setCurrentPage] = useState<"home" | "groups">("home");

  useEffect(() => {
    console.log("HomePage currentPage changed to:", currentPage);
  }, [currentPage]);

  const handleNavigate = (page: "home" | "groups") => {
    console.log("Navigation clicked, changing from", currentPage, "to", page);

    // 즉시 상태 업데이트
    setCurrentPage(page);

    // 강제 리렌더링을 위한 추가 처리
    setTimeout(() => {
      console.log("After state update, currentPage should be:", page);
    }, 0);

    // 스크롤을 맨 위로 이동 (선택사항)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [groupModal, setGroupModal] = useState<{
    isOpen: boolean;
    type: "create" | "join";
  }>({
    isOpen: false,
    type: "create",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setIsLoggedIn(true);
    window.location.reload();
  };

  const openGroupModal = (type: "create" | "join") => {
    if (!isLoggedIn) {
      setShowLogin(true);
    } else {
      setGroupModal({ isOpen: true, type });
    }
  };

  // 홈 페이지 렌더링
  const renderHomePage = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="px-8 py-16 pb-40">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-12"
        >
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="relative">
              <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                Chuluu
              </h1>
              <div className="w-16 h-1 bg-stone-500 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-6">
              <p className="text-xl text-stone-300 leading-relaxed max-w-xl mx-auto">
                <span className="text-stone-100 font-medium">Chuluu(촐로)</span>
                는 몽골어로 <span className="text-stone-200">돌탑</span>이라는
                뜻입니다.
                <br className="hidden sm:block" />
                당신의 추억을 하나하나 마치 돌탑처럼
                <br className="hidden sm:block" />
                당신의 지인들과 쌓아주세요.
              </p>

              <div className="space-y-4">
                <p className="text-lg text-stone-300 leading-relaxed max-w-xl mx-auto">
                  Chuluu는 마치 원석처럼 원본 상태 그대로 있습니다.
                  <br className="hidden sm:block" />
                  마음대로 사진을 공유하고, 추억을 함께 만들어가세요.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-lg">
                  <span className="px-3 py-1 bg-stone-700/50 border border-stone-600/50 rounded-full text-stone-100 font-medium">
                    원본 품질
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="px-3 py-1 bg-stone-700/50 border border-stone-600/50 rounded-full text-stone-100 font-medium">
                    무제한 업로드
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="px-3 py-1 bg-stone-700/50 border border-stone-600/50 rounded-full text-stone-100 font-medium">
                    쉬운 공유
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 로그인 상태에 따른 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {showLogin ? (
              <LoginForm onSuccess={handleLoginSuccess} />
            ) : !isLoggedIn ? (
              <LoginPrompt onLogin={() => setShowLogin(true)} />
            ) : (
              <div className="space-y-12">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    시작하기
                  </h2>
                  <p className="text-stone-400">원하는 작업을 선택해주세요</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ActionCard
                    icon={Plus}
                    title="그룹 생성"
                    description="새로운 그룹을 만들고 친구들을 초대하세요"
                    onClick={() => openGroupModal("create")}
                  />
                  <ActionCard
                    icon={LogInIcon}
                    title="그룹 참가"
                    description="초대 코드로 기존 그룹에 참여하세요"
                    onClick={() => openGroupModal("join")}
                  />
                </div>

                <div className="mt-12">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      최근 업로드
                    </h3>
                    <p className="text-stone-400">
                      최근에 업로드된 사진과 동영상을 확인하세요
                    </p>
                  </div>
                  <MediaGridWidget />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto relative">
        <Header />

        <main>
          {currentPage === "home" ? renderHomePage() : <GroupsPage />}
        </main>

        <GroupModal
          isOpen={groupModal.isOpen}
          onClose={() => setGroupModal({ ...groupModal, isOpen: false })}
          type={groupModal.type}
        />

        {/* 네비게이션을 최상위로 이동 */}
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
      </div>
    </div>
  );
}
