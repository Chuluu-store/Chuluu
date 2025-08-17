import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/database';
import { UploadSession } from '@/entities/upload/model/upload-session.model';
import { Media } from '@/entities/media/model/media.model';
import { Group } from '@/entities/group/model/group.model';
import { verifyToken } from '@/shared/lib/auth';
import { env } from '@/shared/config/env';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import ExifReader from 'exifr';

// 업로드 설정
export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 타임아웃

export async function POST(request: NextRequest) {
  console.log('📁 File upload started');
  try {
    await connectDB();
    
    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('❌ No token provided');
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
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const fileIndex = parseInt(formData.get('fileIndex') as string);

    console.log('📋 Upload request details:', {
      fileName: file?.name,
      fileSize: file?.size,
      sessionId,
      fileIndex
    });

    if (!file || !sessionId || isNaN(fileIndex)) {
      console.error('❌ Missing required fields:', { file: !!file, sessionId: !!sessionId, fileIndex });
      return NextResponse.json(
        { error: '파일, 세션 ID, 파일 인덱스가 필요합니다' },
        { status: 400 }
      );
    }

    // 업로드 세션 확인
    const session = await UploadSession.findOne({
      sessionId,
      userId: decoded.userId
    });

    if (!session) {
      console.error('Upload session not found:', { sessionId, userId: decoded.userId });
      return NextResponse.json(
        { error: '업로드 세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    console.log('Upload session found:', { sessionId, totalFiles: session.totalFiles });

    if (session.status === 'cancelled' || session.status === 'failed') {
      return NextResponse.json(
        { error: '취소되거나 실패한 세션입니다' },
        { status: 400 }
      );
    }

    // 파일 인덱스 유효성 검사
    if (fileIndex >= session.files.length) {
      return NextResponse.json(
        { error: '잘못된 파일 인덱스입니다' },
        { status: 400 }
      );
    }

    // 세션 상태를 uploading으로 변경 (첫 번째 파일인 경우)
    if (session.status === 'initializing') {
      session.status = 'uploading';
      await session.save();
    }

    const sessionFile = session.files[fileIndex];
    
    // 이미 업로드된 파일인지 확인
    if (sessionFile.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: '이미 업로드된 파일입니다',
        mediaId: sessionFile.mediaId
      });
    }

    try {
      // 파일 상태를 uploading으로 변경
      sessionFile.status = 'uploading';
      sessionFile.progress = 0;
      await session.save();

      // 파일 저장 경로 설정
      const uploadDir = env.UPLOAD_PATH;
      const groupDir = path.join(uploadDir, session.groupId.toString());
      const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const dateDir = path.join(groupDir, yearMonth);

      // 디렉토리 생성
      if (!existsSync(dateDir)) {
        await mkdir(dateDir, { recursive: true });
      }

      // 파일명 생성 (중복 방지)
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.name);
      const filename = `${timestamp}_${randomString}${ext}`;
      const filePath = path.join(dateDir, filename);

      // 파일 저장
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      sessionFile.progress = 50; // 파일 저장 완료
      await session.save();

      // 미디어 메타데이터 추출
      let metadata: any = {
        width: undefined,
        height: undefined,
        duration: undefined,
        exif: undefined,
        takenAt: undefined,
        cameraMake: undefined,
        cameraModel: undefined,
        location: undefined
      };

      try {
        if (file.type.startsWith('image/')) {
          // 이미지 메타데이터 추출
          const imageInfo = await sharp(buffer).metadata();
          metadata.width = imageInfo.width;
          metadata.height = imageInfo.height;

          // EXIF 데이터 추출
          try {
            const exifData = await ExifReader.parse(buffer);
            metadata.exif = exifData;

            // 촬영 날짜 추출 (EXIF에서)
            if (exifData.DateTimeOriginal) {
              metadata.takenAt = new Date(exifData.DateTimeOriginal);
            } else if (exifData.DateTime) {
              metadata.takenAt = new Date(exifData.DateTime);
            } else if (exifData.CreateDate) {
              metadata.takenAt = new Date(exifData.CreateDate);
            }

            // 카메라 정보 추출
            if (exifData.Make) {
              metadata.cameraMake = exifData.Make;
            }
            if (exifData.Model) {
              metadata.cameraModel = exifData.Model;
            }

            // GPS 정보 추출
            if (exifData.latitude && exifData.longitude) {
              metadata.location = {
                latitude: exifData.latitude,
                longitude: exifData.longitude
              };
            }
          } catch (exifError) {
            console.log('EXIF 데이터 추출 실패:', exifError);
          }

          // EXIF에서 촬영날짜를 찾지 못한 경우 파일의 수정날짜 사용
          if (!metadata.takenAt) {
            try {
              // 파일명에서 날짜 패턴 찾기 (IMG_20240101_123456.jpg 등)
              const dateMatch = file.name.match(/(\d{4})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})/);
              if (dateMatch) {
                const [, year, month, day, hour, minute, second] = dateMatch;
                metadata.takenAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
              } else {
                // 마지막 수단: 현재 시간 사용
                metadata.takenAt = new Date();
              }
            } catch (dateError) {
              metadata.takenAt = new Date();
            }
          }

          // 썸네일 생성
          try {
            const thumbnailDir = path.join(dateDir, 'thumbnails');
            if (!existsSync(thumbnailDir)) {
              await mkdir(thumbnailDir, { recursive: true });
            }

            const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);
            await sharp(buffer)
              .resize(300, 300, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .jpeg({ quality: 80 })
              .toFile(thumbnailPath);

            metadata.thumbnailPath = thumbnailPath;
          } catch (thumbError) {
            console.log('썸네일 생성 실패:', thumbError);
          }
        } else if (file.type.startsWith('video/')) {
          // 동영상 메타데이터 처리
          // 동영상의 경우 촬영날짜를 파일명이나 생성날짜에서 추출
          if (!metadata.takenAt) {
            try {
              // 파일명에서 날짜 패턴 찾기
              const dateMatch = file.name.match(/(\d{4})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})/);
              if (dateMatch) {
                const [, year, month, day, hour, minute, second] = dateMatch;
                metadata.takenAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
              } else {
                // VID_20240101_123456.mp4 같은 패턴
                const vidMatch = file.name.match(/VID[_-](\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})(\d{2})/);
                if (vidMatch) {
                  const [, year, month, day, hour, minute, second] = vidMatch;
                  metadata.takenAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
                } else {
                  metadata.takenAt = new Date();
                }
              }
            } catch (dateError) {
              metadata.takenAt = new Date();
            }
          }
        }

        // 모든 파일 타입에서 촬영날짜가 없으면 현재 시간 사용
        if (!metadata.takenAt) {
          metadata.takenAt = new Date();
        }
      } catch (metaError) {
        console.log('메타데이터 추출 실패:', metaError);
        // 메타데이터 추출 실패 시에도 촬영날짜는 설정
        if (!metadata.takenAt) {
          metadata.takenAt = new Date();
        }
      }

      sessionFile.progress = 75; // 메타데이터 처리 완료
      await session.save();

      // 미디어 레코드 생성
      const media = await Media.create({
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        thumbnailPath: metadata.thumbnailPath,
        groupId: session.groupId,
        uploadedBy: decoded.userId,
        metadata,
        status: 'completed'
      });

      // 그룹에 미디어 추가
      await Group.findByIdAndUpdate(
        session.groupId,
        { $push: { media: media._id } }
      );

      // 세션 파일 상태 업데이트
      sessionFile.status = 'completed';
      sessionFile.mediaId = media._id;
      sessionFile.progress = 100;
      session.completedFiles += 1;

      // 모든 파일이 완료되었는지 확인
      if (session.completedFiles + session.failedFiles === session.totalFiles) {
        session.status = session.failedFiles > 0 ? 'completed' : 'completed';
        session.completedAt = new Date();
      }

      await session.save();

      return NextResponse.json({
        success: true,
        mediaId: media._id,
        progress: Math.round((session.completedFiles / session.totalFiles) * 100),
        sessionStatus: session.status,
        fileStatus: sessionFile.status
      });

    } catch (fileError) {
      console.error('파일 처리 오류:', fileError);
      
      // 파일 처리 실패
      sessionFile.status = 'failed';
      sessionFile.error = fileError instanceof Error ? fileError.message : '파일 처리 중 오류 발생';
      session.failedFiles += 1;

      // 모든 파일이 완료되었는지 확인
      if (session.completedFiles + session.failedFiles === session.totalFiles) {
        session.status = 'completed';
        session.completedAt = new Date();
      }

      await session.save();

      return NextResponse.json({
        success: false,
        error: sessionFile.error,
        progress: Math.round(((session.completedFiles + session.failedFiles) / session.totalFiles) * 100),
        sessionStatus: session.status
      }, { status: 500 });
    }

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}