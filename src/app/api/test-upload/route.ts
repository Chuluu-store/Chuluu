import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import exifr from "exifr";

import { env } from "../../../shared/config/env";
import { verifyToken } from "../../../shared/lib/auth";
import { connectDB } from "../../../shared/lib/database";
import { Media } from "../../../entities/media/model/media.model";
import { Group } from "../../../entities/group/model/group.model";

export async function POST(request: NextRequest) {
  console.log("🧪 Test upload started");
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const groupId = formData.get("groupId") as string;

    console.log("📋 Test upload details:", {
      fileName: file?.name,
      fileSize: file?.size,
      groupId,
    });

    if (!file || !groupId) {
      return NextResponse.json(
        { error: "파일과 그룹 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 그룹 권한 확인
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(decoded.userId)) {
      return NextResponse.json(
        { error: "그룹 접근 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 파일 저장 경로 설정
    const uploadDir = env.UPLOAD_PATH;
    const groupDir = path.join(uploadDir, groupId);
    const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const dateDir = path.join(groupDir, yearMonth);

    // 디렉토리 생성
    if (!existsSync(dateDir)) {
      await mkdir(dateDir, { recursive: true });
      console.log("📁 Created directory:", dateDir);
    }

    // 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const filename = `${timestamp}_${randomString}${ext}`;
    const filePath = path.join(dateDir, filename);

    console.log("💾 Saving file to:", filePath);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log("✅ File saved successfully");

    // EXIF 메타데이터 추출
    let metadata: any = {};
    if (file.type.startsWith("image/")) {
      try {
        const exifData = await exifr.parse(buffer, {
          pick: [
            "DateTimeOriginal",
            "Make",
            "Model",
            "GPSLatitude",
            "GPSLongitude",
            "ImageWidth",
            "ImageHeight",
          ],
        });

        if (exifData) {
          metadata = {
            takenAt: exifData.DateTimeOriginal || new Date(),
            cameraMake: exifData.Make,
            cameraModel: exifData.Model,
            width: exifData.ImageWidth,
            height: exifData.ImageHeight,
          };

          // GPS 정보가 있으면 추가
          if (exifData.GPSLatitude && exifData.GPSLongitude) {
            metadata.location = {
              latitude: exifData.GPSLatitude,
              longitude: exifData.GPSLongitude,
            };
          }

          console.log("📷 EXIF data extracted:", metadata);
        }
      } catch (exifError) {
        console.log("⚠️ EXIF extraction failed:", exifError);
      }
    }

    // 썸네일 생성
    let thumbnailPath;
    if (file.type.startsWith("image/")) {
      try {
        const thumbnailDir = path.join(dateDir, "thumbnails");
        if (!existsSync(thumbnailDir)) {
          await mkdir(thumbnailDir, { recursive: true });
        }
        thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);
        await sharp(buffer)
          .resize(300, 300, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
        console.log("🖼️ Thumbnail created:", thumbnailPath);
      } catch (thumbError) {
        console.log("⚠️ Thumbnail creation failed:", thumbError);
      }
    }

    // takenAt이 없으면 현재 시간 사용
    if (!metadata.takenAt) {
      metadata.takenAt = new Date();
    }

    // 미디어 레코드 생성
    const media = await Media.create({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: filePath,
      thumbnailPath,
      groupId,
      uploadedBy: decoded.userId,
      metadata,
      status: "completed",
    });

    console.log("💾 Media record created:", media._id);

    // 그룹에 미디어 추가 및 카운트 증가
    await Group.findByIdAndUpdate(groupId, {
      $push: { media: media._id },
      $inc: { mediaCount: 1 },
    });

    return NextResponse.json({
      success: true,
      mediaId: media._id,
      message: "Upload successful",
    });
  } catch (error) {
    console.error("❌ Test upload error:", error);
    return NextResponse.json(
      { error: "업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
