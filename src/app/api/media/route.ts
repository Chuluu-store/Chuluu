import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../shared/lib/auth';
import { connectDB } from '../../../shared/lib/database';
import { Media } from '../../../entities/media/model/media.model';
import { User } from '../../../entities/user/model/user.model';
import { Group } from '../../../entities/group/model/group.model';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 토큰 확인
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    let userId = null;

    if (token) {
      try {
        const decoded = await verifyToken(token);
        userId = decoded?.userId;
      } catch (error) {
        // 토큰 검증 실패 시 userId는 null로 유지
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { status: 'completed' };

    if (userId) {
      // 사용자가 속한 그룹들 조회
      const userGroups = await Group.find({ members: userId }).select('_id').lean();
      const groupIds = userGroups.map(group => group._id);
      
      if (groupIds.length > 0) {
        // 사용자가 속한 그룹의 미디어만 가져오기
        query.groupId = { $in: groupIds };
      } else {
        // 속한 그룹이 없으면 빈 배열 반환
        query._id = { $in: [] };
      }
    }

    const media = await Media.find(query)
      .populate('uploadedBy', 'username email')
      .populate('groupId', 'name')
      .sort({ createdAt: -1, uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Media.countDocuments(query);

    // 응답 데이터 형식 맞추기
    const formattedMedia = media.map((item: any) => ({
      _id: item._id,
      filename: item.filename,
      originalName: item.originalName,
      path: item.path,
      thumbnail: item.thumbnailPath,
      isVideo: item.mimeType?.startsWith('video/'),
      uploadedAt: item.uploadedAt || item.createdAt,
      metadata: {
        width: item.metadata?.width,
        height: item.metadata?.height,
        dateTaken: item.metadata?.takenAt,
      },
      group: item.groupId ? { _id: item.groupId._id || item.groupId, name: item.groupId.name || 'Unknown Group' } : null,
      uploadedBy: item.uploadedBy ? {
        _id: item.uploadedBy._id || item.uploadedBy,
        username: item.uploadedBy.username || 'Unknown User',
        email: item.uploadedBy.email || ''
      } : null,
    }));

    return NextResponse.json({
      media: formattedMedia,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
