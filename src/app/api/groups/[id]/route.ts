import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/database';
import { Group } from '@/entities/group/model/group.model';
import { User } from '@/entities/user/model/user.model';
import { verifyToken } from '@/shared/lib/auth';

// User 모델 등록 확보
User;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const params = await context.params;
    const groupId = params.id;
    
    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      );
    }

    // 그룹 조회
    const group = await Group.findById(groupId)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .lean();

    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    console.log('Group data:', {
      id: group._id,
      owner: group.owner,
      members: group.members,
      userId: decoded.userId
    });

    // 멤버 권한 확인 (populate된 경우와 안된 경우 모두 처리)
    const isMember = group.members.some(member => {
      const memberId = typeof member === 'object' && member._id 
        ? member._id.toString() 
        : member.toString();
      console.log('Checking member:', memberId, '===', decoded.userId);
      return memberId === decoded.userId;
    });
    
    // owner도 확인
    const isGroupOwner = group.owner && (
      typeof group.owner === 'object' 
        ? group.owner._id.toString() === decoded.userId
        : group.owner.toString() === decoded.userId
    );

    if (!isMember && !isGroupOwner) {
      console.log('Access denied - userId:', decoded.userId);
      console.log('Members:', group.members.map(m => typeof m === 'object' ? m._id : m));
      console.log('Owner:', typeof group.owner === 'object' ? group.owner._id : group.owner);
      return NextResponse.json(
        { error: '그룹에 접근할 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 응답 데이터 가공
    const formattedGroup = {
      id: group._id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      owner: group.owner ? {
        id: group.owner._id,
        username: group.owner.username,
        email: group.owner.email
      } : null,
      isOwner: group.owner ? group.owner._id.toString() === decoded.userId : false,
      memberCount: group.members.length,
      mediaCount: group.mediaCount || 0,
      members: group.members.map(member => ({
        id: member._id,
        username: member.username,
        email: member.email
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };

    return NextResponse.json({
      success: true,
      group: formattedGroup
    });

  } catch (error) {
    console.error('Group fetch error:', error);
    return NextResponse.json(
      { error: '그룹 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}