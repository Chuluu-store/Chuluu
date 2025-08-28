import { NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '../../../../../shared/lib/auth';
import { connectDB } from '../../../../../shared/lib/database';
import { Media } from '../../../../../entities/media/model/media.model';
import { Group } from '../../../../../entities/group/model/group.model';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    const params = await context.params;
    const groupId = params.id;
    const url = new URL(request.url);

    // 쿼리 파라미터
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const sortBy = url.searchParams.get('sortBy') || 'takenAt'; // takenAt, uploadedAt
    const order = url.searchParams.get('order') || 'desc'; // desc, asc
    const mediaType = url.searchParams.get('type'); // image, video

    // 그룹 존재 및 권한 확인
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다' }, { status: 404 });
    }

    if (!group.members.includes(decoded.userId)) {
      return NextResponse.json({ error: '그룹에 접근할 권한이 없습니다' }, { status: 403 });
    }

    // 검색 조건 구성
    const filter: any = {
      groupId,
      status: 'completed',
    };

    // 미디어 타입 필터
    if (mediaType === 'image') {
      filter.mimeType = { $regex: '^image/' };
    } else if (mediaType === 'video') {
      filter.mimeType = { $regex: '^video/' };
    }

    // 정렬 조건 설정
    let sortField = 'uploadedAt';
    if (sortBy === 'takenAt') {
      sortField = 'metadata.takenAt';
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortCondition: any = {};
    sortCondition[sortField] = sortOrder;

    // takenAt으로 정렬할 때 null 값 처리
    if (sortBy === 'takenAt') {
      // takenAt이 null인 경우 uploadedAt 기준으로 정렬
      sortCondition['uploadedAt'] = sortOrder;
    }

    // 페이지네이션
    const skip = (page - 1) * limit;

    // 미디어 조회 (업로더 정보 포함)
    const [media, totalCount] = await Promise.all([
      Media.find(filter).populate('uploadedBy', 'username email').sort(sortCondition).skip(skip).limit(limit).lean(),
      Media.countDocuments(filter),
    ]);

    // 날짜별로 그룹화 (아이폰 갤러리 스타일)
    const groupedMedia: { [key: string]: any[] } = {};

    media.forEach((item: any) => {
      // 촬영날짜 기준으로 그룹화 (없으면 업로드날짜 사용)
      const takenDate = item.metadata?.takenAt || item.uploadedAt || item.createdAt;
      const dateKey = new Date(takenDate).toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groupedMedia[dateKey]) {
        groupedMedia[dateKey] = [];
      }

      // EXIF 디버깅
      if (item.metadata) {
        console.log(`📸 Media ${item._id} EXIF:`, {
          filename: item.originalName,
          rawMetadata: item.metadata,
          cameraMake: item.metadata?.cameraMake,
          cameraModel: item.metadata?.cameraModel,
          takenAt: item.metadata?.takenAt,
          iso: item.metadata?.iso,
          exif: item.metadata?.exif ? Object.keys(item.metadata.exif).slice(0, 10) : 'no exif',
        });
      }

      // 응답 데이터 구성
      const mediaItem = {
        id: item._id?.toString() || item._id, // ObjectId를 문자열로 변환
        filename: item.filename,
        originalName: item.originalName,
        path: item.path, // 원본 파일 경로 추가
        mimeType: item.mimeType,
        size: item.size,
        thumbnailPath: item.thumbnailPath,
        uploadedBy: item.uploadedBy
          ? {
              id: item.uploadedBy._id,
              username: item.uploadedBy.username || 'Unknown User',
              email: item.uploadedBy.email || '',
            }
          : {
              id: 'unknown',
              username: 'Unknown User',
              email: '',
            },
        uploadedAt: item.uploadedAt || item.createdAt,
        createdAt: item.createdAt || item.uploadedAt, // 업로드 날짜 추가
        takenAt: item.metadata?.takenAt || null, // 촬영 날짜가 없으면 null
        metadata: {
          width: item.metadata?.width,
          height: item.metadata?.height,
          duration: item.metadata?.duration,
          takenAt: item.metadata?.takenAt, // 메타데이터에서 촬영 날짜
          cameraMake: item.metadata?.cameraMake,
          cameraModel: item.metadata?.cameraModel,
          iso: item.metadata?.iso,
          fNumber: item.metadata?.fNumber,
          exposureTime: item.metadata?.exposureTime,
          focalLength: item.metadata?.focalLength,
          location: item.metadata?.location,
        },
      };

      groupedMedia[dateKey].push(mediaItem);
    });

    // 날짜별 그룹을 배열로 변환하고 정렬
    const sortedGroups = Object.entries(groupedMedia)
      .map(([date, items]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        }),
        count: items.length,
        media: items.sort((a, b) => {
          // 같은 날짜 내에서는 촬영 시간 순으로 정렬
          const aTime = new Date(a.takenAt).getTime();
          const bTime = new Date(b.takenAt).getTime();
          return sortOrder * (aTime - bTime);
        }),
      }))
      .sort((a, b) => {
        // 날짜 그룹을 정렬
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return sortOrder * (aTime - bTime);
      });

    // 페이지네이션 정보
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: sortedGroups,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      groupInfo: {
        id: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
      },
    });
  } catch (error) {
    console.error('Group media fetch error:', error);
    return NextResponse.json({ error: '미디어 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}
