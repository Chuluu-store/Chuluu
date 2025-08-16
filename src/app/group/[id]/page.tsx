'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/widgets/header';
import { BulkUpload } from '@/features/upload/ui/bulk-upload';
import { PhotoGallery } from '@/features/gallery/ui/photo-gallery';
import { 
  ArrowLeft, 
  Upload, 
  Users, 
  Image as ImageIcon,
  Video,
  Settings,
  Share2,
  Calendar
} from 'lucide-react';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    setIsLoggedIn(true);
    // TODO: 실제 그룹 데이터 로드
    loadGroupData();
  }, [groupId, router]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출
      // const response = await fetch(`/api/groups/${groupId}`);
      // const groupData = await response.json();
      
      // 임시 데이터
      setGroup({
        id: groupId,
        name: '몽골 여행 2024',
        description: '몽골 여행에서 찍은 사진과 동영상을 공유하는 그룹입니다.',
        inviteCode: 'MONGO24',
        memberCount: 5,
        mediaCount: 0,
        createdAt: '2024-01-15',
        isOwner: true
      });
    } catch (error) {
      console.error('그룹 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (results: any) => {
    console.log('업로드 완료:', results);
    setShowUpload(false);
    // 그룹 데이터 새로고침
    loadGroupData();
  };

  const handleBackToGroup = () => {
    setShowGallery(false);
    setShowUpload(false);
  };

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      // TODO: 토스트 메시지 표시
      alert('초대 코드가 복사되었습니다!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-stone-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
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
      </div>
    );
  }

  if (showUpload) {
    return (
      <div className="min-h-screen bg-stone-900">
        <Header />
        <div className="p-8 pt-24">
          <BulkUpload
            groupId={groupId}
            onUploadComplete={handleUploadComplete}
            onClose={handleBackToGroup}
          />
        </div>
      </div>
    );
  }

  if (showGallery) {
    return (
      <div className="min-h-screen bg-stone-900">
        <Header />
        <div className="pt-20">
          <PhotoGallery
            groupId={groupId}
            onBack={handleBackToGroup}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <Header />
      
      <div className="p-4 md:p-8 pt-24 max-w-4xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-stone-800/50 hover:bg-stone-700/50 border border-stone-600/50 text-stone-300 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </button>

        {/* 그룹 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-4 md:p-8 mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
            <div className="flex-grow">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-stone-300 text-lg leading-relaxed mb-4">
                  {group.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-stone-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{group.memberCount}명</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>{group.mediaCount}개 미디어</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
                초대하기
              </button>
              
              {group.isOwner && (
                <button className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors">
                  <Settings className="w-4 h-4" />
                  설정
                </button>
              )}
            </div>
          </div>

          {/* 초대 코드 표시 */}
          <div className="bg-stone-900/30 border border-stone-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-stone-400 mb-1">초대 코드</div>
                <div className="text-xl font-mono font-bold text-white tracking-widest">
                  {group.inviteCode}
                </div>
              </div>
              <button
                onClick={copyInviteCode}
                className="px-3 py-2 bg-stone-700/50 hover:bg-stone-600/50 text-stone-300 rounded-lg transition-colors text-sm"
              >
                복사
              </button>
            </div>
          </div>
        </motion.div>

        {/* 메인 액션 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <button
            onClick={() => setShowUpload(true)}
            className="group relative bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-8 hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300 overflow-hidden"
          >
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-600/20 rounded-2xl flex items-center justify-center group-hover:bg-blue-600/30 group-hover:scale-110 transition-all duration-300">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
                  사진/동영상 업로드
                </h3>
                <p className="text-stone-400 leading-relaxed">
                  최대 5000개 파일을 원본 화질로 업로드하세요
                </p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setShowGallery(true)}
            className="group relative bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-3xl p-8 hover:border-stone-600/70 hover:bg-stone-800/70 transition-all duration-300 overflow-hidden"
          >
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-purple-600/20 rounded-2xl flex items-center justify-center group-hover:bg-purple-600/30 group-hover:scale-110 transition-all duration-300">
                <ImageIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">
                  갤러리 보기
                </h3>
                <p className="text-stone-400 leading-relaxed">
                  업로드된 모든 사진과 동영상을 확인하세요
                </p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* 최근 업로드 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-stone-800/50 backdrop-blur-xl border border-stone-700/50 rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">최근 업로드</h2>
          
          {group.mediaCount === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-stone-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-stone-400 mb-2">
                아직 업로드된 미디어가 없습니다
              </h3>
              <p className="text-stone-500 mb-6">
                첫 번째 사진이나 동영상을 업로드해보세요!
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
              >
                지금 업로드하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* TODO: 실제 미디어 썸네일 표시 */}
              <div className="aspect-square bg-stone-700 rounded-xl"></div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}