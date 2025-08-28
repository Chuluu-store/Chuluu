'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Users, Image as ImageIcon, Settings, Share2, Calendar } from 'lucide-react';

import { Header } from "../../../widgets/header";
import { Navigation } from "../../../widgets/navigation";
import { BulkUpload } from "../../../features/upload/ui/bulk-upload";
import { PhotoGallery } from "../../../features/gallery/ui/photo-gallery";
import { toast } from "../../../shared/lib/toast";

interface GroupData {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  memberCount: number;
  mediaCount: number;
  createdAt: string;
  isOwner: boolean;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentMedia, setRecentMedia] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // TODO: 실제 그룹 데이터 로드
    loadGroupData();
  }, [groupId, router]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('Loading group:', groupId);
      const response = await fetch(`/api/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Group API error:', errorData);
        throw new Error(errorData.error || '그룹 정보를 불러올 수 없습니다');
      }

      const data = await response.json();
      console.log('Group data:', data);
      setGroup(data.group);

      // 최근 미디어도 로드
      await loadRecentMedia();
    } catch (error) {
      console.error('그룹 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentMedia = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/groups/${groupId}/media?limit=6&sortBy=uploadedAt&order=desc`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 첫 번째 그룹의 미디어들을 가져와서 최근 6개만 사용
        const allMedia = data.data?.flatMap((group: any) => group.media) || [];
        setRecentMedia(allMedia.slice(0, 6));
      }
    } catch (error) {
      console.error('최근 미디어 로드 오류:', error);
    }
  };

  const handleUploadComplete = async (results: any) => {
    console.log('업로드 완료:', results);
    setShowUpload(false);
    // 성공 메시지 표시
    toast.success('미디어 업로드가 완료되었습니다!');
    // 그룹 데이터 새로고침 - 약간의 지연 후 로드하여 DB 업데이트 확실히 하기
    setTimeout(() => {
      loadGroupData();
    }, 500);
  };

  const handleBackToGroup = () => {
    setShowGallery(false);
    setShowUpload(false);
    // 갤러리에서 돌아올 때 데이터 새로고침 (삭제 등이 있을 수 있음)
    loadGroupData();
  };

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      // TODO: 토스트 메시지 표시
      toast.success("초대 코드가 복사되었습니다!");
    }
  };

  const handleNavigate = (page: 'home' | 'groups') => {
    if (page === 'home') {
      router.push('/');
    } else {
      router.push('/');
      // This will navigate to home which will then show groups page
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900">
        <div className="w-full max-w-md mx-auto relative md:border-x md:border-stone-800 min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white">로딩 중...</div>
          </div>
          <Navigation onNavigate={handleNavigate} currentPage="groups" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-stone-900">
        <div className="w-full max-w-md mx-auto relative md:border-x md:border-stone-800 min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-white text-xl">그룹을 찾을 수 없습니다</div>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
          <Navigation onNavigate={handleNavigate} currentPage="groups" />
        </div>
      </div>
    );
  }

  if (showUpload) {
    return (
      <div className="min-h-screen bg-stone-900">
        <div className="w-full max-w-md mx-auto relative md:border-x md:border-stone-800 min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 py-8 pb-24 overflow-y-auto">
            <BulkUpload groupId={groupId} onUploadComplete={handleUploadComplete} onClose={handleBackToGroup} />
          </div>
          <Navigation onNavigate={handleNavigate} currentPage="groups" />
        </div>
      </div>
    );
  }

  if (showGallery) {
    return (
      <div className="min-h-screen bg-stone-900">
        <div className="w-full max-w-md mx-auto relative md:border-x md:border-stone-800 min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 py-8 pb-24 overflow-y-auto">
            <PhotoGallery groupId={groupId} onBack={handleBackToGroup} />
          </div>
          <Navigation onNavigate={handleNavigate} currentPage="groups" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="w-full max-w-md mx-auto relative md:border-x md:border-stone-800 min-h-screen flex flex-col">
        <Header />

        {/* 메인 컨텐츠 */}
        <div className="flex-1 px-8 py-16 pb-24 overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            {/* 뒤로가기 버튼 */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로가기</span>
            </motion.button>

            {/* 그룹 헤더 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-4"
            >
              <h1 className="text-4xl font-bold text-white">{group.name}</h1>
              {group.description && <p className="text-stone-300 text-lg leading-relaxed">{group.description}</p>}

              {/* 통계 정보 */}
              <div className="flex items-center justify-center gap-6 text-sm text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{group.memberCount}명</span>
                </div>
                <span className="text-stone-600">•</span>
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>{group.mediaCount || 0}개 미디어</span>
                </div>
                <span className="text-stone-600">•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(group.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </motion.div>

            {/* 초대 코드 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-8 text-center"
            >
              <div className="text-sm text-stone-400 mb-2">초대 코드</div>
              <div className="text-3xl font-mono font-bold text-white tracking-wider mb-6">{group.inviteCode}</div>
              <div className="flex gap-3">
                <button
                  onClick={copyInviteCode}
                  className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  초대하기
                </button>
                {group.isOwner && (
                  <button className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Settings className="w-5 h-5" />
                    설정
                  </button>
                )}
              </div>
            </motion.div>

            {/* 메인 액션 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <button
                onClick={() => setShowUpload(true)}
                className="w-full bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-8 hover:bg-stone-800/70 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-stone-700/50 rounded-2xl flex items-center justify-center group-hover:bg-stone-600/50 transition-colors">
                    <Upload className="w-8 h-8 text-stone-300" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold text-white mb-1">사진/동영상 업로드</h3>
                    <p className="text-stone-400 text-sm">최대 5000개 파일을 원본 화질로 업로드하세요</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowGallery(true)}
                className="w-full bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-8 hover:bg-stone-800/70 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-stone-700/50 rounded-2xl flex items-center justify-center group-hover:bg-stone-600/50 transition-colors">
                    <ImageIcon className="w-8 h-8 text-stone-300" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold text-white mb-1">갤러리 보기</h3>
                    <p className="text-stone-400 text-sm">업로드된 모든 사진과 동영상을 확인하세요</p>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* 최근 업로드 섹션 */}
            {group.mediaCount === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="bg-stone-800/30 backdrop-blur border border-stone-700/30 rounded-3xl p-12">
                  <ImageIcon className="w-16 h-16 text-stone-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-stone-400 mb-2">아직 업로드된 미디어가 없습니다</h3>
                  <p className="text-stone-500">첫 번째 사진이나 동영상을 업로드해보세요!</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">최근 업로드</h2>
                  <button
                    onClick={() => setShowGallery(true)}
                    className="text-stone-400 hover:text-white text-sm transition-colors"
                  >
                    전체보기 →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {recentMedia.length > 0
                    ? recentMedia.map((media, index) => (
                        <motion.div
                          key={media.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="aspect-square bg-stone-700 rounded-xl overflow-hidden relative group cursor-pointer"
                          onClick={() => setShowGallery(true)}
                        >
                          {media.mimeType?.startsWith('image/') ? (
                            <img
                              src={`/api/media/thumbnail/${media._id || media.id}?size=200`}
                              alt={media.originalName || media.filename}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                // 썸네일 로드 실패시 원본 이미지 시도
                                const target = e.target as HTMLImageElement;
                                target.src = `/api/media/file/${media._id || media.id}`;
                              }}
                            />
                          ) : (
                            <img
                              src={`/api/media/thumbnail/${media._id || media.id}?size=200`}
                              alt={media.originalName || media.filename}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          )}
                          {media.mimeType?.startsWith('video/') && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {media.uploadedBy && (
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-xs truncate">
                                  {media.uploadedBy.name || media.uploadedBy.email?.split('@')[0] || '알 수 없음'}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    : // 빈 상태일 때 placeholder
                      Array.from({ length: 3 }, (_, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-stone-700/30 rounded-xl border-2 border-dashed border-stone-600 flex items-center justify-center"
                        >
                          <ImageIcon className="w-8 h-8 text-stone-500" />
                        </div>
                      ))}
                </div>
                {recentMedia.length > 0 && (
                  <div className="mt-4 text-center">
                    <p className="text-stone-400 text-sm">최근 업로드된 {recentMedia.length}개의 미디어</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
        <Navigation onNavigate={handleNavigate} currentPage="groups" />
      </div>

    </div>
  );
}
