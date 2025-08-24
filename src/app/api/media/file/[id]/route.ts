import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

import { verifyToken } from "../../../../../shared/lib/auth";
import { connectDB } from "../../../../../shared/lib/database";
import { Media } from "../../../../../entities/media/model/media.model";
import { Group } from "../../../../../entities/group/model/group.model";
import { env } from "../../../../../shared/config/env";

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

    // 임시로 공개 접근 허용 (나중에 보안 강화 필요)
    // TODO: 보안 강화 - 서명된 URL 또는 임시 토큰 사용

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

    // Range 요청 처리 (비디오 스트리밍용)
    const range = request.headers.get("range");
    if (range && media.mimeType.startsWith("video/")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1;
      const chunksize = end - start + 1;

      const file = await readFile(actualFilePath);
      const chunk = file.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": media.mimeType,
          "Cache-Control": "public, max-age=31536000",
          "Last-Modified": fileStat.mtime.toUTCString(),
          ETag: `"${fileStat.size}-${fileStat.mtime.getTime()}"`,
        },
      });
    }

    // 일반 파일 응답
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "public, max-age=31536000",
        "Last-Modified": fileStat.mtime.toUTCString(),
        ETag: `"${fileStat.size}-${fileStat.mtime.getTime()}"`,
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          media.originalName
        )}"`,
      },
    });
  } catch (error) {
    console.error("Media file serve error:", error);
    return NextResponse.json(
      { error: "파일 서빙 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
