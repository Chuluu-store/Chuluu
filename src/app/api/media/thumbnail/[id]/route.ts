import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import sharp from 'sharp';
import path from 'path';

import { verifyToken } from '../../../../../shared/lib/auth';
import { connectDB } from '../../../../../shared/lib/database';
import { Media } from '../../../../../entities/media/model/media.model';
import { Group } from '../../../../../entities/group/model/group.model';
import { env } from '../../../../../shared/config/env';
import { convertHeicToThumbnail } from '../../../../../shared/lib/heic-converter';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 미디어 ID
) {
  try {
    await connectDB();

    const params = await context.params;
    const mediaId = params.id;
    const size = parseInt(request.nextUrl.searchParams.get('size') || '300');

    // 미디어 정보 조회
    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ error: '미디어를 찾을 수 없습니다' }, { status: 404 });
    }

    // 토큰 검증 (선택적)
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') ||
      request.cookies.get('token')?.value ||
      request.nextUrl.searchParams.get('token');

    // 토큰이 있으면 권한 확인
    if (token) {
      const decoded = await verifyToken(token);
      if (decoded) {
        const group = await Group.findById(media.groupId);
        if (!group || !group.members.includes(decoded.userId)) {
          return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
        }
      }
    }
    // TODO: 보안 강화 필요

    // 실제 파일 경로 계산
    const uploadBase = env.UPLOAD_PATH?.startsWith('./')
      ? path.join(process.cwd(), env.UPLOAD_PATH.slice(2))
      : env.UPLOAD_PATH || '/tmp/uploads';

    const actualThumbnailPath = media.thumbnailPath?.startsWith('/uploads/')
      ? path.join(uploadBase, media.thumbnailPath.replace('/uploads/', ''))
      : media.thumbnailPath?.startsWith('/home/pi/')
      ? media.thumbnailPath
      : media.thumbnailPath
      ? path.join(uploadBase, media.thumbnailPath)
      : null;

    const actualFilePath = media.path.startsWith('/uploads/')
      ? path.join(uploadBase, media.path.replace('/uploads/', ''))
      : media.path.startsWith('/home/pi/')
      ? media.path
      : path.join(uploadBase, media.path);

    let thumbnailBuffer: Buffer;

    // 비디오 파일의 경우 기존 썸네일 확인
    const isVideo = media.mimeType?.startsWith('video/');

    if (isVideo && actualThumbnailPath && existsSync(actualThumbnailPath)) {
      try {
        // 비디오 썸네일은 이미 생성되어 있으면 재사용
        thumbnailBuffer = await readFile(actualThumbnailPath);
        console.log(`📹 Using existing video thumbnail: ${actualThumbnailPath}`);

        // 요청된 크기와 다르면 리사이즈
        if (size !== 300) {
          thumbnailBuffer = await sharp(thumbnailBuffer)
            .resize(size, size, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();
        }
      } catch (error) {
        console.log('Failed to load existing video thumbnail, generating new one');
        thumbnailBuffer = await generateThumbnail(actualFilePath, size, media.mimeType);
      }
    } else {
      // 썸네일이 없거나 이미지인 경우 새로 생성
      thumbnailBuffer = await generateThumbnail(actualFilePath, size, media.mimeType);
    }

    return new NextResponse(new Uint8Array(thumbnailBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Length': thumbnailBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Thumbnail serve error:', error);
    return NextResponse.json({ error: '썸네일 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

// 썸네일 생성 함수
async function generateThumbnail(filePath: string, size: number, mimeType?: string): Promise<Buffer> {
  if (!existsSync(filePath)) {
    throw new Error('원본 파일을 찾을 수 없습니다');
  }

  const isHeic =
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    filePath.toLowerCase().endsWith('.heic') ||
    filePath.toLowerCase().endsWith('.heif');

  const isVideo =
    mimeType?.startsWith('video/') ||
    filePath.toLowerCase().endsWith('.mov') ||
    filePath.toLowerCase().endsWith('.mp4');

  try {
    // 비디오 파일 처리
    if (isVideo) {
      console.log(`🎬 Generating video thumbnail: ${filePath}`);

      try {
        // ffmpeg로 썸네일 생성
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // 임시 파일 경로
        const tempPath = `/tmp/video_thumb_${Date.now()}.jpg`;

        // 1초 지점의 프레임을 추출하여 썸네일 생성
        const ffmpegCmd = `ffmpeg -i "${filePath}" -ss 00:00:01 -vframes 1 -vf "scale=${size}:-1" -q:v 2 "${tempPath}"`;

        await execAsync(ffmpegCmd);

        if (existsSync(tempPath)) {
          const thumbnailBuffer = await readFile(tempPath);

          // 임시 파일 삭제
          try {
            const fs = await import('fs/promises');
            await fs.unlink(tempPath);
          } catch (e) {
            // 삭제 실패 무시
          }

          console.log(`✅ Video thumbnail generated: ${thumbnailBuffer.length} bytes`);
          return thumbnailBuffer;
        }
      } catch (ffmpegError) {
        console.log('ffmpeg failed, creating video placeholder:', ffmpegError);
      }

      // ffmpeg 실패 시 플레이스홀더 생성
      const placeholderBuffer = await sharp({
        create: {
          width: size,
          height: size,
          channels: 3,
          background: { r: 44, g: 40, b: 36 },
        },
      })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#2c2824"/>
            <circle cx="${size / 2}" cy="${size / 2}" r="30" fill="rgba(0,0,0,0.5)" stroke="white" stroke-width="2"/>
            <polygon points="${size / 2 - 12},${size / 2 - 18} ${size / 2 - 12},${size / 2 + 18} ${size / 2 + 18},${
                size / 2
              }" fill="white"/>
          </svg>`
            ),
            top: 0,
            left: 0,
          },
        ])
        .jpeg({ quality: 80 })
        .toBuffer();

      return placeholderBuffer;
    }

    // HEIC 파일 특별 처리
    if (isHeic) {
      console.log(`Generating thumbnail for HEIC: ${filePath}`);

      // heic-converter로 썸네일 생성 시도
      const convertedThumbnail = await convertHeicToThumbnail(filePath, size);

      if (convertedThumbnail) {
        console.log(`✅ HEIC thumbnail generated via converter: ${convertedThumbnail.length} bytes`);
        return convertedThumbnail;
      }

      // 변환 실패 시 플레이스홀더 생성
      console.log('HEIC conversion failed, creating placeholder');
      const placeholderBuffer = await sharp({
        create: {
          width: size,
          height: size,
          channels: 3,
          background: { r: 68, g: 64, b: 60 },
        },
      })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#44403c"/>
            <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="20" font-family="Arial">HEIC</text>
            <text x="50%" y="55%" text-anchor="middle" fill="white" font-size="14" font-family="Arial">미리보기</text>
          </svg>`
            ),
            top: 0,
            left: 0,
          },
        ])
        .jpeg({ quality: 80 })
        .toBuffer();

      return placeholderBuffer;
    }

    // 일반 이미지 처리 - 강화된 EXIF 회전 처리
    const sharpInstance = sharp(filePath, {
      failOn: 'none', // 오류 시에도 계속 진행
    });

    // 메타데이터 읽기
    const metadata = await sharpInstance.metadata();

    // EXIF orientation에 따른 회전 적용
    const thumbnailBuffer = await sharpInstance
      .rotate() // 자동 EXIF 회전
      .resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    console.log(`✅ Thumbnail generated with rotation (orientation: ${metadata.orientation})`);
    return thumbnailBuffer;
  } catch (error) {
    console.error('썸네일 생성 실패:', error);

    // 오류 시 기본 플레이스홀더 반환
    const errorBuffer = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: { r: 100, g: 100, b: 100 },
      },
    })
      .jpeg({ quality: 80 })
      .toBuffer();

    return errorBuffer;
  }
}
