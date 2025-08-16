"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, LogIn, Copy, Check } from "lucide-react";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "create" | "join";
}

export function GroupModal({ isOpen, onClose, type }: GroupModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    inviteCode: "",
  });

  const [createdGroup, setCreatedGroup] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const endpoint =
        type === "create" ? "/api/groups/create" : "/api/groups/join";
      const body =
        type === "create"
          ? { name: formData.name, description: formData.description }
          : { inviteCode: formData.inviteCode };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "오류가 발생했습니다");
      }

      if (type === "create") {
        setCreatedGroup(data);
        setSuccess(true);
      } else {
        // 그룹 참가 성공
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (createdGroup?.inviteCode) {
      navigator.clipboard.writeText(createdGroup.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="w-full max-w-md bg-stone-800/90 backdrop-blur-xl border border-stone-700/50 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {type === "create" ? "그룹 생성" : "그룹 참가"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-stone-700/30 rounded-xl transition-all duration-200"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

                {!success ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {type === "create" ? (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-stone-300">
                            그룹 이름
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-stone-900/30 border border-stone-600/50 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-stone-900/50 transition-all duration-200"
                            placeholder="예: 몽골 여행 2024"
                            required
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-stone-300">
                            설명 (선택)
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-stone-900/30 border border-stone-600/50 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-stone-900/50 transition-all duration-200 resize-none"
                            placeholder="그룹 설명을 입력하세요"
                            rows={3}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-stone-300 text-center">
                            초대 코드
                          </label>
                          <input
                            type="text"
                            value={formData.inviteCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                inviteCode: e.target.value.toUpperCase(),
                              })
                            }
                            className="w-full px-4 py-4 bg-stone-900/30 border border-stone-600/50 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-stone-900/50 transition-all duration-200 text-center text-xl tracking-widest font-mono"
                            placeholder="ABCD12"
                            maxLength={6}
                            required
                          />
                        </div>
                        <p className="text-xs text-stone-400 text-center">
                          친구에게 받은 6자리 초대 코드를 입력하세요
                        </p>
                      </div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-6 py-4 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-stone-700 text-white font-medium rounded-xl hover:bg-stone-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-stone-500/30 border-t-stone-300 rounded-full animate-spin mx-auto" />
                        ) : type === "create" ? (
                          "그룹 생성하기"
                        ) : (
                          "그룹 참가하기"
                        )}
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white">
                        그룹이 생성되었습니다!
                      </h3>
                      <p className="text-sm text-stone-400">
                        초대 코드를 친구들과 공유하세요
                      </p>
                    </div>

                    <div className="bg-stone-900/40 border border-stone-700/40 py-4 px-4 rounded-2xl space-y-3">
                      <p className="text-xs text-stone-400 font-medium">
                        초대 코드
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-mono font-bold text-white tracking-[0.3em]">
                          {createdGroup?.inviteCode}
                        </span>
                        <button
                          onClick={copyInviteCode}
                          className="p-2 bg-stone-700/50 hover:bg-stone-600/50 rounded-lg transition-all duration-200"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-stone-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-stone-700 hover:bg-stone-600 rounded-xl text-sm font-medium text-white transition-all duration-200"
                      >
                        확인
                      </button>
                    </div>
                  </motion.div>
                )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
