import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { verifyToken } from "../../../../shared/lib/auth";
import { connectDB } from "../../../../shared/lib/database";
import { Group } from "../../../../entities/group/model/group.model";
import { UploadSession } from "../../../../entities/upload/model/upload-session.model";

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

    const { groupId, files } = await request.json();

    if (!groupId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "그룹 ID와 파일 목록이 필요합니다" },
        { status: 400 }
      );
    }

    // 파일 개수 제한 (최대 5000개)
    if (files.length > 5000) {
      return NextResponse.json(
        { error: "한 번에 최대 5000개 파일까지 업로드할 수 있습니다" },
        { status: 400 }
      );
    }

    // 그룹 존재 및 권한 확인
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "그룹을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!group.members.includes(decoded.userId)) {
      return NextResponse.json(
        { error: "그룹에 접근할 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 파일 검증 및 메타데이터 계산
    const validFiles = [];
    let totalSize = 0;
    const maxFileSize = 500 * 1024 * 1024; // 500MB per file

    for (const file of files) {
      if (!file.name || !file.size || !file.type) {
        continue; // 잘못된 파일 정보는 스킵
      }

      // 파일 크기 제한
      if (file.size > maxFileSize) {
        return NextResponse.json(
          {
            error: `파일 ${file.name}이 너무 큽니다. 최대 500MB까지 지원됩니다.`,
          },
          { status: 400 }
        );
      }

      // 지원하는 파일 타입 확인
      const supportedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
        "image/heif",
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ];

      if (!supportedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `지원하지 않는 파일 형식입니다: ${file.type}` },
          { status: 400 }
        );
      }

      validFiles.push({
        originalName: file.name,
        size: file.size,
        status: "pending",
      });
      totalSize += file.size;
    }

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: "업로드할 유효한 파일이 없습니다" },
        { status: 400 }
      );
    }

    // 총 용량 제한 (10GB)
    const maxTotalSize = 10 * 1024 * 1024 * 1024;
    if (totalSize > maxTotalSize) {
      return NextResponse.json(
        { error: "총 파일 크기가 10GB를 초과합니다" },
        { status: 400 }
      );
    }

    // 업로드 세션 생성
    const sessionId = uuidv4();
    const uploadSession = await UploadSession.create({
      sessionId,
      groupId,
      userId: decoded.userId,
      totalFiles: validFiles.length,
      files: validFiles,
      status: "initializing",
      metadata: {
        totalSize,
        avgFileSize: Math.round(totalSize / validFiles.length),
        estimatedTime: Math.round((totalSize / (1024 * 1024)) * 2), // 대략 1MB당 2초 추정
      },
    });

    return NextResponse.json(
      {
        sessionId: uploadSession.sessionId,
        totalFiles: uploadSession.totalFiles,
        totalSize: uploadSession.metadata.totalSize,
        estimatedTime: uploadSession.metadata.estimatedTime,
        status: uploadSession.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload session creation error:", error);
    return NextResponse.json(
      { error: "업로드 세션 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 업로드 세션 상태 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

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

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "세션 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const session = await UploadSession.findOne({
      sessionId,
      userId: decoded.userId,
    });

    if (!session) {
      return NextResponse.json(
        { error: "업로드 세션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      status: session.status,
      totalFiles: session.totalFiles,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      progress: Math.round((session.completedFiles / session.totalFiles) * 100),
      files: session.files,
      metadata: session.metadata,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    });
  } catch (error) {
    console.error("Upload session query error:", error);
    return NextResponse.json(
      { error: "업로드 세션 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
