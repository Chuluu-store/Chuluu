import { NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '../../../../shared/lib/auth';
import { connectDB } from '../../../../shared/lib/database';
import { User } from '../../../../entities/user/model/user.model';
import { Group } from '../../../../entities/group/model/group.model';

export async function POST(request: NextRequest) {
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

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json({ error: '초대 코드를 입력해주세요' }, { status: 400 });
    }

    // 그룹 찾기
    const group = await Group.findOne({
      inviteCode: inviteCode.toUpperCase(),
    });

    if (!group) {
      return NextResponse.json({ error: '유효하지 않은 초대 코드입니다' }, { status: 404 });
    }

    // 이미 멤버인지 확인
    if (group.members.includes(decoded.userId)) {
      return NextResponse.json({ error: '이미 그룹의 멤버입니다' }, { status: 400 });
    }

    // 그룹에 멤버 추가
    group.members.push(decoded.userId);
    await group.save();

    // 사용자 그룹 목록에 추가
    await User.findByIdAndUpdate(decoded.userId, {
      $push: { groups: group._id },
    });

    return NextResponse.json({
      id: group._id,
      name: group.name,
      description: group.description,
      owner: group.owner,
      members: group.members,
      mediaCount: group.media.length,
    });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: '그룹 참가 중 오류가 발생했습니다' }, { status: 500 });
  }
}
