"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../../header";
import { Navigation } from "../../navigation";
import { GroupsPage } from "../../groups";
import { GroupModal } from "@/features/group/ui/group-modal";
import { HomeContent } from "./home-content";

export function HomePage() {
  const [currentPage, setCurrentPage] = useState<"home" | "groups">("home");
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
    console.log("HomePage currentPage changed to:", currentPage);
  }, [currentPage]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleNavigate = (page: "home" | "groups") => {
    console.log("Navigation clicked, changing from", currentPage, "to", page);
    setCurrentPage(page);

    setTimeout(() => {
      console.log("After state update, currentPage should be:", page);
    }, 0);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="w-full max-w-md mx-auto relative md:border-x md:border-stone-800 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {currentPage === "home" ? (
            <HomeContent
              isLoggedIn={isLoggedIn}
              showLogin={showLogin}
              onLoginSuccess={handleLoginSuccess}
              onOpenGroupModal={openGroupModal}
              onShowLogin={() => setShowLogin(true)}
            />
          ) : (
            <GroupsPage />
          )}
        </main>

        <GroupModal
          isOpen={groupModal.isOpen}
          onClose={() => setGroupModal({ ...groupModal, isOpen: false })}
          type={groupModal.type}
        />

        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
      </div>
    </div>
  );
}
