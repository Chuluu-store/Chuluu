import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

import { verifyToken } from "../../../../../shared/lib/auth";
import { connectDB } from "../../../../../shared/lib/database";
import { Media } from "../../../../../entities/media/model/media.model";
import { Group } from "../../../../../entities/group/model/group.model";
import { env } from "../../../../../shared/config/env";

// 원본 파일 다운로드 전용 엔드포인트 (HEIC 변환 없음)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const params = await context.params;
    const mediaId = params.id;

    // 미디어 정보 먼저 조회
    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json(
        { error: "미디어를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 토큰 검증 (선택적 - 쿠키 또는 헤더에서)
    const token =
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      request.cookies.get("token")?.value ||
      request.nextUrl.searchParams.get("token");

    // 토큰이 있으면 권한 확인
    if (token) {
      const decoded = await verifyToken(token);
      if (decoded) {
        // 그룹 권한 확인
        const group = await Group.findById(media.groupId);
        if (!group || !group.members.includes(decoded.userId)) {
          return NextResponse.json(
            { error: "접근 권한이 없습니다" },
            { status: 403 }
          );
        }
      }
    }

    // 실제 파일 경로 계산 (상대 경로를 절대 경로로 변환)
    const uploadBase = env.UPLOAD_PATH?.startsWith("./") 
      ? path.join(process.cwd(), env.UPLOAD_PATH.slice(2))
      : env.UPLOAD_PATH || "/tmp/uploads";
      
    const actualFilePath = media.path.startsWith("/uploads/")
      ? path.join(uploadBase, media.path.replace("/uploads/", ""))
      : media.path.startsWith("/home/pi/")
      ? media.path  // 기존 절대 경로 호환
      : path.join(uploadBase, media.path);

    // 파일 존재 확인
    if (!existsSync(actualFilePath)) {
      console.error("File not found:", actualFilePath);
      return NextResponse.json(
        { error: "파일을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 파일 정보 조회
    const fileStat = await stat(actualFilePath);
    const fileBuffer = await readFile(actualFilePath);

    // 원본 파일 다운로드 응답 (변환 없이 원본 그대로)
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          media.originalName
        )}"`, // attachment로 다운로드 강제
        "Cache-Control": "no-cache", // 다운로드는 캐시하지 않음
        "Last-Modified": fileStat.mtime.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Media download error:", error);
    return NextResponse.json(
      { error: "파일 다운로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}