import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { connectDB, createSuccessResponse, createErrorResponse, ERROR_MESSAGES, HTTP_STATUS } from '../../../../shared/lib';
import { Media } from '../../../../entities/media/model/media.model';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return createErrorResponse('파일을 선택해주세요', HTTP_STATUS.BAD_REQUEST);
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

    return createSuccessResponse(
      { files: uploadedFiles },
      '파일 업로드 성공',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('[POST /api/media/upload] 파일 업로드 오류 :', error);
    return createErrorResponse(
      ERROR_MESSAGES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      '파일 업로드 중 오류가 발생했습니다'
    );
  }
}
