import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import sharp from "sharp";

import { verifyToken } from "../../../../../shared/lib/auth";
import { connectDB } from "../../../../../shared/lib/database";
import { Media } from "../../../../../entities/media/model/media.model";
import { Group } from "../../../../../entities/group/model/group.model";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 미디어 ID
) {
  try {
    await connectDB();

    const params = await context.params;
    const mediaId = params.id;
    const size = parseInt(request.nextUrl.searchParams.get("size") || "300");

    // 미디어 정보 조회
    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json(
        { error: "미디어를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 토큰 검증 (선택적)
    const token =
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      request.cookies.get("token")?.value ||
      request.nextUrl.searchParams.get("token");

    // 토큰이 있으면 권한 확인
    if (token) {
      const decoded = await verifyToken(token);
      if (decoded) {
        const group = await Group.findById(media.groupId);
        if (!group || !group.members.includes(decoded.userId)) {
          return NextResponse.json(
            { error: "접근 권한이 없습니다" },
            { status: 403 }
          );
        }
      }
    }
    // TODO: 보안 강화 필요

    let thumbnailBuffer: Buffer;

    // 기존 썸네일이 있는지 확인
    if (media.thumbnailPath && existsSync(media.thumbnailPath)) {
      try {
        thumbnailBuffer = await readFile(media.thumbnailPath);

        // 요청된 크기와 다르면 리사이즈
        if (size !== 300) {
          thumbnailBuffer = await sharp(thumbnailBuffer)
            .resize(size, size, {
              fit: "inside",
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();
        }
      } catch (thumbError) {
        console.log("기존 썸네일 로드 실패, 새로 생성:", thumbError);
        thumbnailBuffer = await generateThumbnail(media.path, size);
      }
    } else {
      // 썸네일이 없으면 새로 생성
      thumbnailBuffer = await generateThumbnail(media.path, size);
    }

    return new NextResponse(new Uint8Array(thumbnailBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
        "Content-Length": thumbnailBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Thumbnail serve error:", error);
    return NextResponse.json(
      { error: "썸네일 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 썸네일 생성 함수
async function generateThumbnail(
  filePath: string,
  size: number
): Promise<Buffer> {
  if (!existsSync(filePath)) {
    throw new Error("원본 파일을 찾을 수 없습니다");
  }

  try {
    const thumbnailBuffer = await sharp(filePath)
      .resize(size, size, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnailBuffer;
  } catch (error) {
    console.error("썸네일 생성 실패:", error);
    throw error;
  }
}
