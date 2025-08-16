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
    inviteCode: ""
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

      const endpoint = type === "create" ? "/api/groups/create" : "/api/groups/join";
      const body = type === "create" 
        ? { name: formData.name, description: formData.description }
        : { inviteCode: formData.inviteCode };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="glass-card p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  {type === "create" ? (
                    <>
                      <Plus className="w-6 h-6 text-white" />
                      <span>그룹 생성</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-6 h-6 text-white" />
                      <span>그룹 참가</span>
                    </>
                  )}
                </h2>
                <button
                  onClick={onClose}
                  className="glass-button p-2 rounded-xl hover:bg-white/10"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {type === "create" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          그룹 이름
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="예: 몽골 여행 2024"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          설명 (선택)
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-colors resize-none"
                          placeholder="그룹 설명을 입력하세요"
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        초대 코드
                      </label>
                      <input
                        type="text"
                        value={formData.inviteCode}
                        onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-colors text-center text-xl tracking-widest font-mono"
                        placeholder="ABCD12"
                        maxLength={6}
                        required
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        친구에게 받은 6자리 초대 코드를 입력하세요
                      </p>
                    </div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      type === "create" ? "그룹 생성하기" : "그룹 참가하기"
                    )}
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white">
                    그룹이 생성되었습니다!
                  </h3>
                  
                  <div className="glass-card p-4 rounded-2xl">
                    <p className="text-sm text-gray-400 mb-2">초대 코드</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-3xl font-mono font-bold text-white tracking-widest">
                        {createdGroup?.inviteCode}
                      </span>
                      <button
                        onClick={copyInviteCode}
                        className="glass-button p-2 rounded-xl hover:bg-white/10"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    이 코드를 친구들과 공유하여 그룹에 초대하세요
                  </p>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="glass-button px-6 py-2 rounded-2xl text-sm font-medium text-gray-200 hover:text-white"
                  >
                    확인
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}