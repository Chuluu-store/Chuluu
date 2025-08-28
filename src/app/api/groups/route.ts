import { NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '../../../shared/lib/auth';
import { connectDB } from '../../../shared/lib/database';
import { User } from '../../../entities/user/model/user.model';
import { Group } from '../../../entities/group/model/group.model';

// User 모델 등록 확보
User;

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Getting groups list...');
    await connectDB();

    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('❌ No token for groups list');
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.error('❌ Invalid token for groups list');
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    console.log('✅ Getting groups for userId:', decoded.userId);

    // 사용자가 속한 그룹들 조회
    const groups = await Group.find({
      members: decoded.userId,
    })
      .populate('owner', 'username email')
      .sort({ updatedAt: -1 }) // 최근 업데이트된 순서로 정렬
      .lean();

    console.log(`📦 Found ${groups.length} groups for user`);

    // 응답 데이터 가공 (owner가 null인 경우 처리)
    const formattedGroups = groups.map((group) => ({
      id: group._id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      owner: group.owner
        ? {
            id: group.owner._id,
            username: group.owner.username,
            email: group.owner.email,
          }
        : {
            id: null,
            username: 'Unknown User',
            email: '',
          },
      isOwner: group.owner ? group.owner._id.toString() === decoded.userId : false,
      memberCount: group.members.length,
      mediaCount: group.mediaCount || 0,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      groups: formattedGroups,
      count: formattedGroups.length,
    });
  } catch (error) {
    console.error('Groups fetch error:', error);
    return NextResponse.json({ error: '그룹 목록 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}
