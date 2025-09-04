import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import sharp from 'sharp';
import path from 'path';

import { verifyToken } from '../../../../../shared/lib/auth';
import { connectDB } from '../../../../../shared/lib/database';
import { Media } from '../../../../../entities/media/model/media.model';
import { Group } from '../../../../../entities/group/model/group.model';
import { env } from '../../../../../shared/config/env';

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

    const actualFilePath = media.path.startsWith('/uploads/')
      ? path.join(uploadBase, media.path.replace('/uploads/', ''))
      : media.path.startsWith('/home/pi/')
      ? media.path
      : path.join(uploadBase, media.path);

    // 원본 파일이 존재하는지 확인
    if (!existsSync(actualFilePath)) {
      return NextResponse.json({ error: '원본 파일을 찾을 수 없습니다' }, { status: 404 });
    }

    // 원본 이미지를 리사이즈해서 제공 (이미지만)
    let thumbnailBuffer: Buffer;
    
    if (media.mimeType?.startsWith('image/')) {
      try {
        thumbnailBuffer = await sharp(actualFilePath)
          .rotate() // EXIF 회전 정보 적용
          .resize(size, size, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch (error) {
        console.error('Image resize failed:', error);
        return NextResponse.json({ error: '이미지 처리 중 오류가 발생했습니다' }, { status: 500 });
      }
    } else {
      // 비디오나 기타 파일은 플레이스홀더
      thumbnailBuffer = await sharp({
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

