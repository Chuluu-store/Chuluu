import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import path from "path";
import sharp from "sharp";
import exifr from "exifr";
import { connectDB } from "@/shared/lib/database";
import { MediaModel } from "@/entities/media/model/schema";
import { Group } from "@/entities/group/model/group.model";
import { verifyToken } from "@/shared/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const groupId = request.headers.get('X-Group-Id');
    
    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // 그룹별 폴더 생성
    const groupFolder = groupId || 'general';
    const uploadDir = path.join(process.cwd(), "public", "uploads", groupFolder);
    const thumbnailDir = path.join(process.cwd(), "public", "thumbnails", groupFolder);

    await mkdir(uploadDir, { recursive: true });
    await mkdir(thumbnailDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 원본 파일명 유지하면서 중복 방지
      let filename = file.name;
      let filepath = path.join(uploadDir, filename);
      let counter = 1;
      
      // 파일이 이미 존재하면 숫자 추가
      while (true) {
        try {
          await access(filepath, constants.F_OK);
          // 파일이 존재하면 새 이름 생성
          const ext = path.extname(file.name);
          const nameWithoutExt = path.basename(file.name, ext);
          filename = `${nameWithoutExt}_${counter}${ext}`;
          filepath = path.join(uploadDir, filename);
          counter++;
        } catch {
          // 파일이 존재하지 않으면 사용 가능
          break;
        }
      }

      await writeFile(filepath, buffer);

      let thumbnailPath = "";
      let metadata: any = {};
      const isVideo = file.type.startsWith("video/");

      if (!isVideo) {
        try {
          const exifData = await exifr.parse(buffer);
          metadata = {
            width: exifData?.ImageWidth,
            height: exifData?.ImageHeight,
            dateTaken: exifData?.DateTimeOriginal || exifData?.CreateDate,
            camera: exifData?.Make
              ? `${exifData.Make} ${exifData.Model}`
              : undefined,
            location:
              exifData?.latitude && exifData?.longitude
                ? {
                    latitude: exifData.latitude,
                    longitude: exifData.longitude,
                  }
                : undefined,
          };

          const thumbnailFilename = `thumb-${filename}`;
          thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

          await sharp(buffer)
            .resize(400, 400, { fit: "cover", position: "center" })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

          thumbnailPath = `/thumbnails/${groupFolder}/${thumbnailFilename}`;
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }

      const mediaDoc = await MediaModel.create({
        filename,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        path: `/uploads/${groupFolder}/${filename}`,
        thumbnail: thumbnailPath,
        metadata,
        isVideo,
        groupId: groupId || null,
        uploadedBy: decoded.userId
      });
      
      // 그룹에 미디어 추가
      if (groupId) {
        await Group.findByIdAndUpdate(
          groupId,
          { $push: { media: mediaDoc._id } }
        );
      }

      uploadedFiles.push(mediaDoc);
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
      groupId: groupId || null
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
