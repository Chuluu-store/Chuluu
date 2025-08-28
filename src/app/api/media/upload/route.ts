import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// MongoDB 연결
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(process.env.MONGODB_URI!);
};

// Media 모델
const MediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimetype: { type: String, required: true },
    thumbnail: { type: String },
    isVideo: { type: Boolean, default: false },
    metadata: {
      width: Number,
      height: Number,
      dateTaken: Date,
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Media = mongoose.models.Media || mongoose.model('Media', MediaSchema);

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '파일을 선택해주세요' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // 업로드 디렉토리 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 파일명 생성 (중복 방지)
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const filepath = path.join(uploadDir, filename);

      // 파일 저장
      await writeFile(filepath, buffer);

      // 파일 정보를 DB에 저장
      const mediaDoc = await Media.create({
        filename: filename,
        originalName: file.name,
        path: `/uploads/${filename}`,
        size: file.size,
        mimetype: file.type,
        isVideo: file.type.startsWith('video/'),
        metadata: {
          dateTaken: new Date(),
        },
      });

      uploadedFiles.push(mediaDoc);
    }

    return NextResponse.json({
      message: '파일 업로드 성공',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다' }, { status: 500 });
  }
}
