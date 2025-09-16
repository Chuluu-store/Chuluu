import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../shared/lib/database';
import { verifyToken } from '../../../../shared/lib/auth';
import { Media } from '../../../../entities/media/model/media.model';
import { Group } from '../../../../entities/group/model/group.model';
import { env } from '../../../../shared/config/env';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    console.log('📦 ZIP 다운로드 요청 시작');
    
    // 토큰 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('✅ 토큰 검증 성공:', userId);

    const { mediaIds, groupId } = await request.json();

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json({ error: '다운로드할 미디어를 선택해주세요' }, { status: 400 });
    }

    if (mediaIds.length > 100) {
      return NextResponse.json({ error: '한 번에 최대 100개까지만 다운로드할 수 있습니다' }, { status: 400 });
    }

    console.log(`📋 ${mediaIds.length}개 미디어 ZIP 압축 요청`);

    // 데이터베이스 연결
    await connectDB();

    // 그룹 권한 확인
    if (groupId) {
      const group = await Group.findById(groupId).populate('members', '_id');
      if (!group) {
        return NextResponse.json({ error: '그룹을 찾을 수 없습니다' }, { status: 404 });
      }

      const isMember = group.members.some((member: any) => member._id.toString() === userId);
      if (!isMember) {
        return NextResponse.json({ error: '이 그룹에 접근할 권한이 없습니다' }, { status: 403 });
      }
    }

    // 미디어 파일들 조회
    const mediaFiles = await Media.find({
      _id: { $in: mediaIds },
      ...(groupId ? { groupId } : {})
    }).populate('uploadedBy', 'username email');

    if (mediaFiles.length === 0) {
      return NextResponse.json({ error: '다운로드할 미디어를 찾을 수 없습니다' }, { status: 404 });
    }

    console.log(`📁 ${mediaFiles.length}개 미디어 파일 조회 완료`);

    // ZIP 파일 생성을 위한 스트림 설정
    const archive = archiver('zip', {
      zlib: { level: 1 } // 빠른 압축을 위해 압축 레벨을 낮춤
    });

    // 응답 헤더 설정
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const zipFileName = groupId ? `chuluu_group_photos_${timestamp}.zip` : `chuluu_photos_${timestamp}.zip`;
    
    const response = new NextResponse(archive as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Cache-Control': 'no-cache',
      },
    });

    // 에러 핸들링
    archive.on('error', (err) => {
      console.error('❌ ZIP 압축 오류:', err);
      throw err;
    });

    // ZIP에 파일들 추가
    let addedCount = 0;
    for (const media of mediaFiles) {
      try {
        // 실제 파일 경로 계산 (파일 API와 동일한 로직)
        const uploadBase = env.UPLOAD_PATH?.startsWith('./')
          ? path.join(process.cwd(), env.UPLOAD_PATH.slice(2))
          : env.UPLOAD_PATH || path.join(process.cwd(), 'public', 'uploads');

        // 미디어 파일 경로: {uploadBase}/{groupId}/{filename}
        const filePath = path.join(uploadBase, media.groupId.toString(), media.filename);
        
        // 파일 존재 확인
        if (!fs.existsSync(filePath)) {
          console.warn(`⚠️ 파일을 찾을 수 없음: ${filePath}`);
          continue;
        }

        // 파일명 생성 (업로더 정보 포함)
        const uploader = media.uploadedBy?.username || media.uploadedBy?.email?.split('@')[0] || 'unknown';
        const fileExtension = path.extname(media.originalName || media.filename);
        const baseName = path.basename(media.originalName || media.filename, fileExtension);
        const safeFileName = `${baseName}_by_${uploader}${fileExtension}`;
        
        // ZIP에 파일 추가
        archive.file(filePath, { name: safeFileName });
        addedCount++;
        
        console.log(`📎 파일 추가: ${safeFileName}`);
      } catch (error) {
        console.error(`❌ 파일 추가 오류 (${media.filename}):`, error);
      }
    }

    if (addedCount === 0) {
      return NextResponse.json({ error: '압축할 수 있는 파일이 없습니다' }, { status: 404 });
    }

    console.log(`✅ ${addedCount}개 파일 ZIP 압축 시작`);

    // ZIP 압축 완료
    archive.finalize();

    return response;

  } catch (error) {
    console.error('❌ ZIP 다운로드 오류:', error);
    return NextResponse.json(
      { error: 'ZIP 다운로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}