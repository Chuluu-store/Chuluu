import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import { verifyToken } from '../../../../../shared/lib/auth';
import { connectDB } from '../../../../../shared/lib/database';
import { Media } from '../../../../../entities/media/model/media.model';
import { Group } from '../../../../../entities/group/model/group.model';
import { env } from '../../../../../shared/config/env';
import { convertHeicToJpeg } from '../../../../../shared/lib/heic-converter';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const params = await context.params;
    const mediaId = params.id;

    // 미디어 정보 먼저 조회
    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ error: '미디어를 찾을 수 없습니다' }, { status: 404 });
    }

    // 쿠키에서 토큰 검증
    const token = request.cookies.get('token')?.value;
    console.log('[FILE] 토큰 확인:', token ? '토큰 있음' : '토큰 없음');
    
    if (!token) {
      console.log('[FILE] 토큰이 없습니다');
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    console.log('[FILE] 토큰 검증 결과:', decoded ? '성공' : '실패');
    if (!decoded) {
      console.log('[FILE] 유효하지 않은 토큰입니다');
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    // 그룹 권한 확인
    const group = await Group.findById(media.groupId);
    if (!group || !group.members.includes(decoded.userId)) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
    }

    // 실제 파일 경로 계산 (상대 경로를 절대 경로로 변환)
    const uploadBase = env.UPLOAD_PATH?.startsWith('./')
      ? path.join(process.cwd(), env.UPLOAD_PATH.slice(2))
      : env.UPLOAD_PATH || '/tmp/uploads';

    const actualFilePath = media.path.startsWith('/uploads/')
      ? path.join(uploadBase, media.path.replace('/uploads/', ''))
      : media.path.startsWith('/home/pi/')
      ? media.path // 기존 절대 경로 호환
      : path.join(uploadBase, media.path);

    // 파일 존재 확인
    if (!existsSync(actualFilePath)) {
      console.error('[GET /api/media/file] 파일을 찾을 수 없음 :', actualFilePath);
      return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
    }

    // 파일 정보 조회
    const fileStat = await stat(actualFilePath);
    const fileBuffer = await readFile(actualFilePath);

    // Range 요청 처리 (비디오 스트리밍용)
    const range = request.headers.get('range');
    if (range && media.mimeType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1;
      const chunksize = end - start + 1;

      const file = await readFile(actualFilePath);
      const chunk = file.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': media.mimeType,
          'Cache-Control': 'public, max-age=31536000',
          'Last-Modified': fileStat.mtime.toUTCString(),
          ETag: `"${fileStat.size}-${fileStat.mtime.getTime()}"`,
        },
      });
    }

    // HEIC/HEIF 파일은 JPEG로 변환하여 제공
    const isHeic =
      media.mimeType === 'image/heic' ||
      media.mimeType === 'image/heif' ||
      actualFilePath.toLowerCase().endsWith('.heic') ||
      actualFilePath.toLowerCase().endsWith('.heif');

    if (isHeic) {
      console.log('[GET /api/media/file] HEIC 파일을 JPEG로 변환 시작 :', actualFilePath);

      // 먼저 시스템 명령어로 변환 시도
      const convertedBuffer = await convertHeicToJpeg(actualFilePath);

      if (convertedBuffer) {
        console.log('[GET /api/media/file] HEIC 변환 성공 :', `${convertedBuffer.length} bytes`);

        return new NextResponse(new Uint8Array(convertedBuffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': convertedBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000',
            'Last-Modified': fileStat.mtime.toUTCString(),
            ETag: `"${fileStat.size}-${fileStat.mtime.getTime()}-converted"`,
            'Content-Disposition': `inline; filename="${encodeURIComponent(
              media.originalName.replace(/\.(heic|heif)$/i, '.jpg')
            )}"`,
          },
        });
      } else {
        // 변환 실패 시 Sharp로 플레이스홀더 생성
        console.log('[GET /api/media/file] HEIC 변환 실패, 플레이스홀더 생성 :', actualFilePath);

        const sharp = await import('sharp');
        const placeholderBuffer = await sharp
          .default({
            create: {
              width: 800,
              height: 600,
              channels: 3,
              background: { r: 68, g: 64, b: 60 },
            },
          })
          .composite([
            {
              input: Buffer.from(
                `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#44403c"/>
              <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="36" font-family="Arial">HEIC 파일</text>
              <text x="50%" y="52%" text-anchor="middle" fill="white" font-size="20" font-family="Arial">브라우저 미리보기 불가</text>
              <text x="50%" y="58%" text-anchor="middle" fill="white" font-size="16" font-family="Arial">다운로드하여 확인하세요</text>
            </svg>`
              ),
              top: 0,
              left: 0,
            },
          ])
          .jpeg({ quality: 90 })
          .toBuffer();

        return new NextResponse(new Uint8Array(placeholderBuffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': placeholderBuffer.length.toString(),
            'Cache-Control': 'no-cache',
            'Content-Disposition': `inline; filename="preview.jpg"`,
          },
        });
      }
    }

    // 일반 파일 응답
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Last-Modified': fileStat.mtime.toUTCString(),
        ETag: `"${fileStat.size}-${fileStat.mtime.getTime()}"`,
        'Content-Disposition': `inline; filename="${encodeURIComponent(media.originalName)}"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/media/file] 파일 서빙 중 오류 발생 :', error);
    return NextResponse.json({ error: '파일 서빙 중 오류가 발생했습니다' }, { status: 500 });
  }
}
