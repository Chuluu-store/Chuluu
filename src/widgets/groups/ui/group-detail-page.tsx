"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Calendar, Image as ImageIcon } from "lucide-react";

import { PhotoGallery } from "../../../features/gallery/ui/photo-gallery";
import { BulkUpload } from "../../../features/upload/ui/bulk-upload";
import { type Group } from "../../../entities/group/model/types";

interface GroupDetailPageProps {
  group: Group;
  onBack: () => void;
}

export function GroupDetailPage({ group, onBack }: GroupDetailPageProps) {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");

  const handleUploadComplete = () => {
    // 업로드 완료 후 갤러리 탭으로 이동 (갤러리 컴포넌트가 자체적으로 데이터를 새로고침함)
    setActiveTab("gallery");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="px-8 py-16 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* 헤더 */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2 bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-xl hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-stone-300" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white mb-1">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-stone-400 text-sm">{group.description}</p>
              )}
            </div>
          </div>

          {/* 그룹 정보 */}
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-6">
            <div className="flex items-center justify-between text-sm text-stone-400">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{group.memberCount}명</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>{group.mediaCount}개</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-1">
            <div className="relative grid grid-cols-2 gap-1">
              {/* 슬라이딩 배경 */}
              <motion.div
                layoutId="groupDetailActiveTab"
                className="absolute top-0 bottom-0 bg-stone-700 rounded-xl"
                style={{
                  width: "calc(50% - 2px)",
                }}
                initial={false}
                animate={{
                  x: activeTab === "upload" ? "calc(100% + 4px)" : "0%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 40,
                  mass: 1,
                }}
              />

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("gallery")}
                className={`relative z-10 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "gallery" ? "text-white" : "text-stone-400"
                }`}
              >
                갤러리
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("upload")}
                className={`relative z-10 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "upload" ? "text-white" : "text-stone-400"
                }`}
              >
                업로드
              </motion.button>
            </div>
          </div>

          {/* 컨텐츠 */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "gallery" ? (
              <PhotoGallery groupId={group.id} />
            ) : (
              <BulkUpload
                groupId={group.id}
                onUploadComplete={handleUploadComplete}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
