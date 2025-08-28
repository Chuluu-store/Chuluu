import { NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '../../../../shared/lib/auth';
import { connectDB } from '../../../../shared/lib/database';
import { User } from '../../../../entities/user/model/user.model';
import { Group } from '../../../../entities/group/model/group.model';

// User 모델 등록 확보
User;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const params = await context.params;
    const groupId = params.id;

    console.log('🔍 Getting group with ID:', groupId);

    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;

    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.error('❌ Invalid token');
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    console.log('✅ Token verified for userId:', decoded.userId);

    // 그룹 조회 - 먼저 기본 데이터만 조회
    let group = await Group.findById(groupId).lean();

    console.log('📦 Group query result:', group ? 'Found' : 'Not found');

    if (!group) {
      // 추가 디버깅: 모든 그룹 목록 확인
      const allGroups = await Group.find({}, '_id name').lean();
      console.error('❌ Group not found. Available groups:', allGroups);

      return NextResponse.json({ error: '그룹을 찾을 수 없습니다' }, { status: 404 });
    }

    // populate 시도 (실패해도 계속 진행)
    try {
      group = await Group.findById(groupId)
        .populate('owner', 'username email')
        .populate('members', 'username email')
        .lean();
    } catch (popError) {
      console.warn('⚠️ Populate failed, using raw data:', popError);
    }

    console.log('Group data:', {
      id: (group as any)._id,
      owner: (group as any).owner,
      members: (group as any).members,
      memberCount: (group as any).members?.length || 0,
      userId: decoded.userId,
    });

    // 멤버 권한 확인 - members 배열이 없거나 비어있는 경우 처리
    let isMember = false;
    if ((group as any).members && Array.isArray((group as any).members) && (group as any).members.length > 0) {
      isMember = (group as any).members.some((member: any) => {
        if (!member) return false;
        const memberId = typeof member === 'object' && member._id ? member._id.toString() : member?.toString();
        console.log('Checking member:', memberId, '===', decoded.userId);
        return memberId === decoded.userId;
      });
    }

    // owner도 확인
    let isGroupOwner = false;
    if ((group as any).owner) {
      isGroupOwner =
        typeof (group as any).owner === 'object'
          ? (group as any).owner._id?.toString() === decoded.userId
          : (group as any).owner?.toString() === decoded.userId;
    }

    if (!isMember && !isGroupOwner) {
      console.log('Access denied - userId:', decoded.userId);
      console.log(
        'Members:',
        (group as any).members.map((m: any) => (typeof m === 'object' ? m._id : m))
      );
      console.log('Owner:', typeof (group as any).owner === 'object' ? (group as any).owner._id : (group as any).owner);
      return NextResponse.json({ error: '그룹에 접근할 권한이 없습니다' }, { status: 403 });
    }

    // 응답 데이터 가공 - null/undefined 처리 강화
    const formattedGroup = {
      id: (group as any)._id?.toString() || groupId,
      name: (group as any).name || 'Unknown Group',
      description: (group as any).description || '',
      inviteCode: (group as any).inviteCode || '',
      owner:
        (group as any).owner && typeof (group as any).owner === 'object'
          ? {
              id: (group as any).owner._id?.toString() || (group as any).owner,
              username: (group as any).owner.username || 'Unknown User',
              email: (group as any).owner.email || '',
            }
          : (group as any).owner
          ? {
              id: (group as any).owner.toString(),
              username: 'Unknown User',
              email: '',
            }
          : null,
      isOwner: isGroupOwner,
      memberCount: (group as any).members?.length || 0,
      mediaCount: (group as any).mediaCount || 0,
      members: Array.isArray((group as any).members)
        ? (group as any).members
            .map((member: any) => {
              if (!member) return null;
              if (typeof member === 'object' && member._id) {
                return {
                  id: member._id.toString(),
                  username: member.username || 'Unknown User',
                  email: member.email || '',
                };
              }
              return {
                id: member.toString(),
                username: 'Unknown User',
                email: '',
              };
            })
            .filter(Boolean)
        : [],
      createdAt: (group as any).createdAt || new Date(),
      updatedAt: (group as any).updatedAt || new Date(),
    };

    return NextResponse.json({
      success: true,
      group: formattedGroup,
    });
  } catch (error) {
    console.error('Group fetch error:', error);
    return NextResponse.json({ error: '그룹 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}
