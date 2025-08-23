import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../shared/lib/database";
import { Group } from "../../../../entities/group/model/group.model";
import { User } from "../../../../entities/user/model/user.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { groupId, newOwnerId } = await request.json();

    if (!groupId || !newOwnerId) {
      return NextResponse.json(
        { error: "그룹 ID와 새 소유자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    console.log(`🔧 Reassigning group ${groupId} to user ${newOwnerId}`);

    // 그룹 찾기
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "그룹을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 새 소유자 찾기
    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return NextResponse.json(
        { error: "새 소유자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 그룹의 owner 변경
    group.owner = newOwnerId;
    
    // members 배열 초기화 및 새 소유자 추가
    group.members = [newOwnerId];
    
    // 그룹 저장
    await group.save();
    console.log(`✅ Group owner changed to ${newOwnerId}`);

    // 새 소유자의 groups 배열에 그룹 추가
    if (!newOwner.groups || !Array.isArray(newOwner.groups)) {
      newOwner.groups = [];
    }

    const userGroupIds = newOwner.groups.map((g: any) => g.toString());
    if (!userGroupIds.includes(groupId)) {
      newOwner.groups.push(groupId as any);
      await newOwner.save();
      console.log(`✅ Added group ${groupId} to new owner's groups`);
    }

    // 업데이트된 그룹 정보 반환
    const updatedGroup = await Group.findById(groupId)
      .populate("owner", "username email")
      .populate("members", "username email")
      .lean();

    return NextResponse.json({
      success: true,
      message: "그룹 소유자가 변경되었습니다",
      group: {
        _id: (updatedGroup as any)?._id,
        name: (updatedGroup as any)?.name,
        owner: (updatedGroup as any)?.owner,
        members: (updatedGroup as any)?.members,
        memberCount: (updatedGroup as any)?.members?.length || 0,
      }
    });
  } catch (error) {
    console.error("Reassign group error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "그룹 재할당 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}