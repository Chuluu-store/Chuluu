import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/database';
import { Media } from '@/entities/media/model/media.model';
import { Group } from '@/entities/group/model/group.model';
import { verifyToken } from '@/shared/lib/auth';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const params = await context.params;
    
    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                  request.nextUrl.searchParams.get('token');
    
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

    const mediaId = params.id;

    // 미디어 정보 조회
    const media = await Media.findById(mediaId).populate('groupId');
    if (!media) {
      return NextResponse.json(
        { error: '미디어를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 그룹 권한 확인
    const group = await Group.findById(media.groupId);
    if (!group || !group.members.includes(decoded.userId)) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 파일 존재 확인
    if (!existsSync(media.path)) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 파일 정보 조회
    const fileStat = await stat(media.path);
    const fileBuffer = await readFile(media.path);

    // Range 요청 처리 (비디오 스트리밍용)
    const range = request.headers.get('range');
    if (range && media.mimeType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1;
      const chunksize = (end - start) + 1;
      
      const file = await readFile(media.path);
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
          'ETag': `"${fileStat.size}-${fileStat.mtime.getTime()}"`,
        },
      });
    }

    // 일반 파일 응답
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Last-Modified': fileStat.mtime.toUTCString(),
        'ETag': `"${fileStat.size}-${fileStat.mtime.getTime()}"`,
        'Content-Disposition': `inline; filename="${encodeURIComponent(media.originalName)}"`,
      },
    });

  } catch (error) {
    console.error('Media file serve error:', error);
    return NextResponse.json(
      { error: '파일 서빙 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}