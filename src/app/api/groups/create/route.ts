import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "../../../../shared/lib/auth";
import { connectDB } from "../../../../shared/lib/database";
import { User } from "../../../../entities/user/model/user.model";
import { Group } from "../../../../entities/group/model/group.model";

export async function POST(request: NextRequest) {
  try {
    console.log("🆕 Creating new group...");
    await connectDB();

    // 토큰 검증
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.error("❌ No token provided for group creation");
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.error("❌ Invalid token for group creation");
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    console.log("✅ Creating group for userId:", decoded.userId);

    const { name, description } = await request.json();
    console.log("📝 Group details:", { name, description });

    if (!name) {
      return NextResponse.json(
        { error: "그룹 이름을 입력해주세요" },
        { status: 400 }
      );
    }

    // 고유한 초대 코드 생성
    const generateInviteCode = (): string => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return code;
    };

    let inviteCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      inviteCode = generateInviteCode();
      const existingGroup = await Group.findOne({ inviteCode });
      if (!existingGroup) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      inviteCode = generateInviteCode() + Date.now().toString().slice(-2);
    }

    // 그룹 생성
    const group = await Group.create({
      name,
      description,
      inviteCode,
      owner: decoded.userId,
      members: [decoded.userId],
      media: [],
      mediaCount: 0,
    });

    console.log("✅ Group created successfully:", {
      id: group._id.toString(),
      name: group.name,
      inviteCode: group.inviteCode,
    });

    // 사용자 그룹 목록에 추가
    await User.findByIdAndUpdate(decoded.userId, {
      $push: { groups: group._id },
    });

    console.log("✅ User groups updated for userId:", decoded.userId);

    return NextResponse.json(
      {
        id: group._id.toString(),
        name: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        owner: group.owner,
        members: group.members,
        mediaCount: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "그룹 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
