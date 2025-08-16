"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LoginForm } from "@/features/auth/ui/login-form";
import { GroupModal } from "@/features/group/ui/group-modal";
import { LoginPrompt } from "@/features/auth/ui/login-prompt";
import { GroupsHero } from "@/widgets/groups/ui/groups-hero";
import { GroupsList } from "@/widgets/groups/ui/groups-list";
import { EmptyGroupsState } from "@/widgets/groups/ui/empty-groups-state";
import { type Group } from "@/entities/group/model/types";



export function GroupsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupModal, setGroupModal] = useState<{isOpen: boolean, type: "create" | "join"}>({ 
    isOpen: false, 
    type: "create" 
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (token && user) {
      setIsLoggedIn(true);
      // TODO: 실제 그룹 데이터 로드
      // fetchUserGroups();
      
      // 임시 데이터
      setGroups([
        
      ]);
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

  const handleGroupClick = (group: Group) => {
    console.log("그룹 선택:", group);
    // TODO: 그룹 상세 페이지로 이동
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-900">
        <div className="px-6 py-12 pb-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl mx-auto space-y-12"
          >
            <GroupsHero 
              title="내 그룹" 
              subtitle="로그인하여 그룹을 관리하세요" 
            />

            {showLogin ? (
              <LoginForm onSuccess={handleLoginSuccess} />
            ) : (
              <LoginPrompt onLogin={() => setShowLogin(true)} />
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="px-6 py-12 pb-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl mx-auto space-y-12"
        >
          <GroupsHero 
            title="내 그룹" 
            subtitle="참여 중인 그룹을 관리하세요" 
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {groups.length === 0 ? (
              <EmptyGroupsState 
                onCreateGroup={() => openGroupModal("create")}
                onJoinGroup={() => openGroupModal("join")}
              />
            ) : (
              <GroupsList 
                groups={groups}
                onCreateGroup={() => openGroupModal("create")}
                onGroupClick={handleGroupClick}
              />
            )}

            <GroupModal 
              isOpen={groupModal.isOpen}
              onClose={() => setGroupModal({ ...groupModal, isOpen: false })}
              type={groupModal.type}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}