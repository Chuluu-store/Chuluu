import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

import { verifyToken } from "../../../../shared/lib/auth";
import { connectDB } from "../../../../shared/lib/database";
import { Media } from "../../../../entities/media/model/media.model";
import { Group } from "../../../../entities/group/model/group.model";
import { env } from "../../../../shared/config/env";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const params = await context.params;
    const mediaId = params.id;

    // 토큰 검증
    const token =
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      request.cookies.get("token")?.value;

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

    // 미디어 정보 조회
    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json(
        { error: "미디어를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 그룹 권한 확인 (그룹 멤버 또는 업로더 본인만 삭제 가능)
    const group = await Group.findById(media.groupId);
    if (!group) {
      return NextResponse.json(
        { error: "그룹을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const isGroupMember = group.members.some(
      (memberId: any) => memberId.toString() === decoded.userId
    );
    const isUploader = media.uploadedBy.toString() === decoded.userId;
    const isGroupOwner = group.owner.toString() === decoded.userId;

    if (!isGroupMember && !isUploader) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 실제 파일 경로 계산
    const uploadBase = env.UPLOAD_PATH?.startsWith("./") 
      ? path.join(process.cwd(), env.UPLOAD_PATH.slice(2))
      : env.UPLOAD_PATH || "/tmp/uploads";

    // 파일 삭제 (원본 파일)
    const actualFilePath = media.path.startsWith("/uploads/")
      ? path.join(uploadBase, media.path.replace("/uploads/", ""))
      : media.path.startsWith("/home/pi/")
      ? media.path
      : path.join(uploadBase, media.path);

    if (actualFilePath && existsSync(actualFilePath)) {
      try {
        await unlink(actualFilePath);
        console.log("원본 파일 삭제:", actualFilePath);
      } catch (error) {
        console.error("원본 파일 삭제 실패:", error);
      }
    }

    // 썸네일 파일 삭제
    const actualThumbnailPath = media.thumbnailPath?.startsWith("/uploads/")
      ? path.join(uploadBase, media.thumbnailPath.replace("/uploads/", ""))
      : media.thumbnailPath?.startsWith("/home/pi/")
      ? media.thumbnailPath
      : media.thumbnailPath 
      ? path.join(uploadBase, media.thumbnailPath)
      : null;

    if (actualThumbnailPath && existsSync(actualThumbnailPath)) {
      try {
        await unlink(actualThumbnailPath);
        console.log("썸네일 파일 삭제:", actualThumbnailPath);
      } catch (error) {
        console.error("썸네일 파일 삭제 실패:", error);
      }
    }

    // 데이터베이스에서 미디어 정보 삭제
    await Media.findByIdAndDelete(mediaId);

    // 그룹의 mediaCount 업데이트
    await Group.findByIdAndUpdate(media.groupId, { $inc: { mediaCount: -1 } });

    return NextResponse.json({
      success: true,
      message: "미디어가 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json(
      { error: "미디어 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
