import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "../../../../shared/lib/database";
import { Group } from "../../../../entities/group/model/group.model";
import { User } from "../../../../entities/user/model/user.model";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // URL 파라미터에서 그룹 ID 가져오기
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("id");

    if (groupId) {
      // 특정 그룹 상세 정보
      const group = await Group.findById(groupId).lean();

      if (!group) {
        return NextResponse.json(
          { error: "그룹을 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      // owner와 members 정보 별도 조회
      let ownerInfo = null;
      if ((group as any).owner) {
        try {
          ownerInfo = await User.findById((group as any).owner).lean();
        } catch (e) {
          console.error("Owner lookup failed:", e);
        }
      }

      let membersInfo = [];
      if ((group as any).members && Array.isArray((group as any).members)) {
        for (const memberId of (group as any).members) {
          try {
            const member = await User.findById(memberId).lean();
            membersInfo.push(
              member || { _id: memberId, error: "User not found" }
            );
          } catch (e) {
            membersInfo.push({
              _id: memberId,
              error: e instanceof Error ? e.message : "Unknown error",
            });
          }
        }
      }

      return NextResponse.json({
        group: {
          _id: (group as any)._id,
          name: (group as any).name,
          description: (group as any).description,
          inviteCode: (group as any).inviteCode,
          owner: (group as any).owner,
          ownerInfo,
          members: (group as any).members,
          membersInfo,
          mediaCount: (group as any).mediaCount,
          createdAt: (group as any).createdAt,
          updatedAt: (group as any).updatedAt,
        },
      });
    } else {
      // 모든 그룹 목록
      const groups = await Group.find({}).lean();
      const users = await User.find({}).lean();

      return NextResponse.json({
        totalGroups: groups.length,
        totalUsers: users.length,
        groups: groups.map((g: any) => ({
          _id: g._id,
          name: g.name,
          inviteCode: g.inviteCode,
          owner: g.owner,
          memberCount: g.members?.length || 0,
          members: g.members || [],
          mediaCount: g.mediaCount || 0,
        })),
        users: users.map((u: any) => ({
          _id: u._id,
          username: u.username,
          email: u.email,
          groupCount: u.groups?.length || 0,
        })),
      });
    }
  } catch (error) {
    console.error("Debug groups error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "오류 발생" },
      { status: 500 }
    );
  }
}
