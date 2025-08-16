import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/database';
import { Media } from '@/entities/media/model/media.model';
import { Group } from '@/entities/group/model/group.model';
import { verifyToken } from '@/shared/lib/auth';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // 토큰 검증 (쿼리 파라미터에서도 허용)
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
    const size = parseInt(request.nextUrl.searchParams.get('size') || '300');

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

    let thumbnailBuffer: Buffer;
    
    // 기존 썸네일이 있는지 확인
    if (media.thumbnailPath && existsSync(media.thumbnailPath)) {
      try {
        thumbnailBuffer = await readFile(media.thumbnailPath);
        
        // 요청된 크기와 다르면 리사이즈
        if (size !== 300) {
          thumbnailBuffer = await sharp(thumbnailBuffer)
            .resize(size, size, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 80 })
            .toBuffer();
        }
      } catch (thumbError) {
        console.log('기존 썸네일 로드 실패, 새로 생성:', thumbError);
        thumbnailBuffer = await generateThumbnail(media.path, size);
      }
    } else {
      // 썸네일이 없으면 새로 생성
      thumbnailBuffer = await generateThumbnail(media.path, size);
    }

    return new NextResponse(thumbnailBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Length': thumbnailBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Thumbnail serve error:', error);
    return NextResponse.json(
      { error: '썸네일 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 썸네일 생성 함수
async function generateThumbnail(filePath: string, size: number): Promise<Buffer> {
  if (!existsSync(filePath)) {
    throw new Error('원본 파일을 찾을 수 없습니다');
  }

  try {
    const thumbnailBuffer = await sharp(filePath)
      .resize(size, size, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return thumbnailBuffer;
  } catch (error) {
    console.error('썸네일 생성 실패:', error);
    throw error;
  }
}