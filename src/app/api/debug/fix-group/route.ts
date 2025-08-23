import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../shared/lib/database";
import { Group } from "../../../../entities/group/model/group.model";
import { User } from "../../../../entities/user/model/user.model";
import { verifyToken } from "../../../../shared/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 토큰 검증
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "그룹 ID가 필요합니다" },
        { status: 400 }
      );
    }

    console.log(`🔧 Fixing group ${groupId} for user ${decoded.userId}`);

    // 그룹 찾기
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "그룹을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 사용자 찾기
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 그룹의 owner가 없으면 현재 사용자를 owner로 설정
    if (!group.owner) {
      group.owner = decoded.userId;
      console.log(`✅ Set owner to ${decoded.userId}`);
    }

    // 그룹의 members 배열이 없거나 비어있으면 초기화하고 현재 사용자 추가
    if (!group.members || !Array.isArray(group.members)) {
      group.members = [];
    }

    // 현재 사용자가 members에 없으면 추가
    const memberIds = group.members.map((m: any) => m.toString());
    if (!memberIds.includes(decoded.userId)) {
      group.members.push(decoded.userId as any);
      console.log(`✅ Added user ${decoded.userId} to members`);
    }

    // 그룹 저장
    await group.save();

    // 사용자의 groups 배열에도 그룹 추가 (없으면)
    if (!user.groups || !Array.isArray(user.groups)) {
      user.groups = [];
    }

    const userGroupIds = user.groups.map((g: any) => g.toString());
    if (!userGroupIds.includes(groupId)) {
      user.groups.push(groupId as any);
      await user.save();
      console.log(`✅ Added group ${groupId} to user's groups`);
    }

    // 업데이트된 그룹 정보 반환
    const updatedGroup = await Group.findById(groupId)
      .populate("owner", "username email")
      .populate("members", "username email")
      .lean();

    return NextResponse.json({
      success: true,
      message: "그룹이 수정되었습니다",
      group: {
        _id: (updatedGroup as any)?._id,
        name: (updatedGroup as any)?.name,
        owner: (updatedGroup as any)?.owner,
        members: (updatedGroup as any)?.members,
        memberCount: (updatedGroup as any)?.members?.length || 0,
      }
    });
  } catch (error) {
    console.error("Fix group error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "그룹 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}