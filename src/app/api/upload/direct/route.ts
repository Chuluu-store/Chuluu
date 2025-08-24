import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import ExifReader from "exifr";
import sharp from "sharp";
import path from "path";

import { env } from "../../../../shared/config/env";
import { verifyToken } from "../../../../shared/lib/auth";
import { connectDB } from "../../../../shared/lib/database";
import { Media } from "../../../../entities/media/model/media.model";
import { Group } from "../../../../entities/group/model/group.model";

// 업로드 설정
export const runtime = "nodejs";
export const maxDuration = 300; // 5분 타임아웃

export async function POST(request: NextRequest) {
  console.log("📁 Direct file upload started");
  try {
    await connectDB();

    // 토큰 검증
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.error("❌ No token provided");
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const groupId = formData.get("groupId") as string;

    console.log("📋 Upload request details:", {
      fileName: file?.name,
      fileSize: file?.size,
      groupId,
    });

    if (!file || !groupId) {
      console.error("❌ Missing required fields:", {
        file: !!file,
        groupId: !!groupId,
      });
      return NextResponse.json(
        { error: "파일과 그룹 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 그룹 확인 및 권한 체크
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "그룹을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 그룹 멤버 권한 확인
    if (!group.members.includes(decoded.userId)) {
      return NextResponse.json(
        { error: "그룹에 업로드할 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 파일 크기 제한 (500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 최대 500MB까지 업로드할 수 있습니다" },
        { status: 400 }
      );
    }

    // 지원되는 파일 타입 확인
    const supportedTypes = [
      // 이미지
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      "image/heic",
      "image/heif",
      // 비디오
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/mkv",
      "video/wmv",
      "video/flv",
      "video/webm",
      "video/3gp",
      "video/m4v",
    ];

    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `지원하지 않는 파일 형식입니다: ${file.type}` },
        { status: 400 }
      );
    }

    // 업로드 디렉토리 생성
    const uploadDir = env.UPLOAD_PATH || "/tmp/uploads";
    const groupDir = path.join(uploadDir, groupId);

    if (!existsSync(groupDir)) {
      await mkdir(groupDir, { recursive: true });
    }

    // 파일 저장
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const fileName = `${timestamp}_${originalName.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const filePath = path.join(groupDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    console.log(`✅ File saved: ${filePath}`);

    // EXIF 데이터 추출
    let metadata = {};
    try {
      if (file.type.startsWith("image/") || file.name.toLowerCase().endsWith('.heic')) {
        metadata = await ExifReader.parse(filePath) || {};
        console.log("📸 EXIF extracted:", JSON.stringify(metadata, null, 2).substring(0, 500));
      }
    } catch (error) {
      console.warn("⚠️ EXIF extraction failed:", error);
    }

    // 촬영 날짜는 이제 metadata에서 직접 처리

    // 썸네일 생성
    let thumbnailPath = null;
    if (file.type.startsWith("image/")) {
      try {
        const thumbnailDir = path.join(groupDir, "thumbnails");
        if (!existsSync(thumbnailDir)) {
          await mkdir(thumbnailDir, { recursive: true });
        }

        const thumbnailName = `thumb_${fileName.replace(extension, ".jpg")}`;
        thumbnailPath = path.join(thumbnailDir, thumbnailName);

        await sharp(filePath)
          .resize(300, 300, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        console.log(`✅ Thumbnail generated: ${thumbnailPath}`);
      } catch (error) {
        console.warn("⚠️ Thumbnail generation failed:", error);
      }
    }

    // 미디어 정보를 데이터베이스에 저장
    // 상대 경로로 저장 (웹에서 접근 가능한 경로)
    const relativePath = `/uploads/${groupId}/${fileName}`;
    const relativeThumbnailPath = thumbnailPath
      ? `/uploads/${groupId}/thumbnails/thumb_${fileName.replace(
          extension,
          ".jpg"
        )}`
      : null;

    const media = await Media.create({
      filename: originalName,
      originalName,
      path: relativePath,
      thumbnailPath: relativeThumbnailPath,
      mimeType: file.type,
      size: file.size,
      groupId,
      uploadedBy: decoded.userId,
      status: "completed",  // status 필드 추가
      metadata: {
        width: (metadata as any).ImageWidth || (metadata as any).PixelXDimension || (metadata as any)['Image Width'] || null,
        height: (metadata as any).ImageLength || (metadata as any).PixelYDimension || (metadata as any)['Image Height'] || null,
        cameraMake: (metadata as any).Make || (metadata as any)['271'] || null,
        cameraModel: (metadata as any).Model || (metadata as any)['272'] || null,
        takenAt: (metadata as any).DateTimeOriginal || (metadata as any)['36867'] || (metadata as any).CreateDate || (metadata as any)['36868'] || null,
        iso: (metadata as any).ISO || (metadata as any).ISOSpeedRatings || null,
        fNumber: (metadata as any).FNumber || (metadata as any).ApertureValue || null,
        exposureTime: (metadata as any).ExposureTime || null,
        focalLength: (metadata as any).FocalLength || null,
        location: (metadata as any).GPS || (metadata as any).GPSLatitude
          ? {
              latitude: (metadata as any).GPS?.latitude || (metadata as any).GPSLatitude || null,
              longitude: (metadata as any).GPS?.longitude || (metadata as any).GPSLongitude || null,
            }
          : null,
        exif: metadata,
      },
    });

    // 그룹의 미디어 카운트 업데이트
    await Group.findByIdAndUpdate(groupId, {
      $inc: { mediaCount: 1 },
      $set: { updatedAt: new Date() },
    });

    console.log(`✅ Media saved to database: ${media._id}`);

    return NextResponse.json({
      success: true,
      mediaId: media._id,
      filename: originalName,
      size: file.size,
      thumbnailPath: thumbnailPath ? `/api/media/thumbnail/${media._id}` : null,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "파일 업로드 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
