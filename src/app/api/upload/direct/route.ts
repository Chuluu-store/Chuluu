import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import ExifReader from 'exifreader';
import sharp from 'sharp';
import path from 'path';

import { env } from '../../../../shared/config/env';
import { verifyToken } from '../../../../shared/lib/auth';
import { connectDB } from '../../../../shared/lib/database';
import { Media } from '../../../../entities/media/model/media.model';
import { Group } from '../../../../entities/group/model/group.model';
import {
  parseExifFromFile,
  parseHeicExifBuffer,
  parseExifFromBuffer,
  normalizeMetadata,
} from '../../../../shared/lib/exif-utils';
import { convertHeicToThumbnail } from '../../../../shared/lib/heic-converter';

// 업로드 설정
export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 타임아웃

export async function POST(request: NextRequest) {
  console.log('📁 Direct file upload started');
  try {
    await connectDB();

    // 토큰 검증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string;

    console.log('📋 Upload request details:', {
      fileName: file?.name,
      fileSize: file?.size,
      groupId,
    });

    if (!file || !groupId) {
      console.error('❌ Missing required fields:', {
        file: !!file,
        groupId: !!groupId,
      });
      return NextResponse.json({ error: '파일과 그룹 ID가 필요합니다' }, { status: 400 });
    }

    // 그룹 확인 및 권한 체크
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다' }, { status: 404 });
    }

    // 그룹 멤버 권한 확인
    if (!group.members.includes(decoded.userId)) {
      return NextResponse.json({ error: '그룹에 업로드할 권한이 없습니다' }, { status: 403 });
    }

    // 파일 크기 제한 (500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 최대 500MB까지 업로드할 수 있습니다' }, { status: 400 });
    }

    // 지원되는 파일 타입 확인 - 확장자 우선 체크
    const fileExt = path.extname(file.name).toLowerCase().slice(1);
    const supportedExtensions = [
      // 이미지
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
      'tiff',
      'tif',
      'svg',
      'heic',
      'heif',
      // 비디오
      'mp4',
      'avi',
      'mov',
      'mkv',
      'wmv',
      'flv',
      'webm',
      '3gp',
      'm4v',
    ];

    // 확장자로 먼저 체크
    if (!supportedExtensions.includes(fileExt)) {
      // MIME 타입으로 재확인
      const supportedTypes = [
        // 이미지
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
        'image/heic',
        'image/heif',
        // 비디오
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/quicktime',
        'video/mkv',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/3gp',
        'video/m4v',
        'video/x-msvideo',
        'video/x-matroska',
      ];

      if (!supportedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `지원하지 않는 파일 형식입니다: ${file.name} (${file.type || 'unknown type'})` },
          { status: 400 }
        );
      }
    }

    console.log(`✅ File type accepted: ${file.name} (ext: ${fileExt}, type: ${file.type})`);

    // 업로드 디렉토리 생성
    const uploadDir = env.UPLOAD_PATH || '/tmp/uploads';
    const groupDir = path.join(uploadDir, groupId);

    if (!existsSync(groupDir)) {
      await mkdir(groupDir, { recursive: true });
    }

    // 파일 저장 - EXIF 정보 보존을 위해 원본 그대로 저장
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const fileName = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(groupDir, fileName);

    // ArrayBuffer로 직접 저장 (EXIF 정보 보존)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log(`✅ File saved with EXIF preserved: ${filePath}`);

    // EXIF 데이터 추출 - fs로 파일에서 직접 읽기 (원본 데이터 보존)
    let metadata: any = {};
    try {
      // 모든 이미지 파일에 대해 fs로 EXIF 직접 추출
      if (
        file.type.startsWith('image/') ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')
      ) {
        console.log('📷 Processing image file with fs:', file.name, 'Type:', file.type);

        // fs로 파일에서 직접 EXIF 읽기
        const exifData = await parseExifFromFile(filePath);

        if (exifData) {
          console.log('✅ EXIF extracted successfully:', {
            make: exifData.make,
            model: exifData.model,
            dateTimeOriginal: exifData.dateTimeOriginal,
            iso: exifData.iso,
            gps: exifData.gps ? 'GPS data found' : 'No GPS',
            totalTags: exifData.allTags ? Object.keys(exifData.allTags).length : 0,
          });
          metadata = exifData;
        } else {
          // EXIF 추출 실패 시 Sharp로 기본 메타데이터만 추출
          console.log('⚠️ EXIF extraction failed, using Sharp for basic metadata');
          try {
            const sharpMetadata = await sharp(filePath).metadata();
            metadata = {
              width: sharpMetadata.width,
              height: sharpMetadata.height,
              format: sharpMetadata.format,
              orientation: sharpMetadata.orientation,
            };

            // Sharp의 EXIF 버퍼가 있으면 파싱 시도
            if (sharpMetadata.exif) {
              const parsedExif = parseHeicExifBuffer(sharpMetadata.exif);
              if (parsedExif) {
                metadata = { ...metadata, ...parsedExif };
              }
            }
          } catch (sharpError) {
            console.error('⚠️ Sharp metadata extraction also failed:', sharpError);
          }
        }
      } else if (file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mov')) {
        // 비디오 파일의 메타데이터 추출 시도 (MOV 파일 특별 처리)
        console.log(`🎬 Processing video file: ${file.name}`);

        try {
          // ExifReader로 먼저 시도 (특히 iPhone MOV 파일에 효과적)
          const fileBuffer = await readFile(filePath);
          const tags = ExifReader.load(fileBuffer);

          // GPS 정보 추출
          let gpsData = null;
          if (tags['GPSLatitude'] && tags['GPSLongitude']) {
            // GPS 좌표 변환 (도분초 → 십진법)
            const convertGPS = (value: any): number | null => {
              if (!value || !Array.isArray(value) || value.length !== 3) {
                // description이 이미 십진법인 경우
                if (typeof value === 'number') return value;
                if (value?.description && typeof value.description === 'number') return value.description;
                return null;
              }
              const [degrees, minutes, seconds] = value;
              return degrees + minutes / 60 + seconds / 3600;
            };

            const latValue = tags['GPSLatitude'].description || convertGPS(tags['GPSLatitude'].value);
            const lonValue = tags['GPSLongitude'].description || convertGPS(tags['GPSLongitude'].value);

            if (latValue && lonValue) {
              gpsData = {
                latitude: latValue,
                longitude: lonValue,
                altitude: tags['GPSAltitude']?.description || tags['GPSAltitude']?.value,
              };
              console.log('📍 GPS 정보 추출:', gpsData);
            }
          }

          // 카메라 정보 추출
          const make = tags['Make']?.description || tags['Make']?.value || tags['271']?.description;
          const model = tags['Model']?.description || tags['Model']?.value || tags['272']?.description;
          
          metadata = {
            // 카메라 정보
            make: make,
            model: model,
            
            // 날짜 정보
            dateTimeOriginal: tags['DateTimeOriginal']?.description || tags['DateTime']?.description || tags['CreateDate']?.description,
            createDate: tags['CreateDate']?.description || tags['DateTimeDigitized']?.description,
            
            // 비디오 크기
            width: tags['ImageWidth']?.value || tags['PixelXDimension']?.value || tags['Image Width']?.value,
            height: tags['ImageHeight']?.value || tags['PixelYDimension']?.value || tags['Image Height']?.value,
            
            // 비디오 관련
            duration: tags['Duration']?.value || tags['MediaDuration']?.value,
            
            // 촬영 설정
            iso: tags['ISOSpeedRatings']?.value || tags['ISO']?.value,
            fNumber: tags['FNumber']?.value || tags['FNumber']?.description,
            exposureTime: tags['ExposureTime']?.description || tags['ExposureTime']?.value,
            focalLength: tags['FocalLength']?.value || tags['FocalLength']?.description,
            
            // GPS
            gps: gpsData,
            
            // 기타
            orientation: tags['Orientation']?.value || tags['Orientation']?.description,
            software: tags['Software']?.description || tags['Software']?.value,
            lensModel: tags['LensModel']?.description || tags['LensMake']?.description,
          };

          console.log('🎥 Video EXIF metadata extracted:', metadata);
        } catch (videoExifError) {
          console.log('⚠️ Video EXIF extraction failed, using ffprobe as fallback');

          // ffprobe로 비디오 메타데이터 추출 시도
          try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            const { stdout } = await execAsync(
              `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
            );

            const ffprobeData = JSON.parse(stdout);
            const videoStream = ffprobeData.streams?.find((s: any) => s.codec_type === 'video');

            // ffprobe에서 추출한 메타데이터 태그들
            const formatTags = ffprobeData.format?.tags || {};
            
            
            // GPS 정보 추출 (com.apple.quicktime.location.ISO6709 형식)
            let gpsData = null;
            if (formatTags['com.apple.quicktime.location.ISO6709']) {
              const locationStr = formatTags['com.apple.quicktime.location.ISO6709'];
              // +37.5275+126.8977+080.000/ 형식 파싱
              const match = locationStr.match(/([+-]\d+\.?\d*)([+-]\d+\.?\d*)([+-]\d+\.?\d*)?/);
              if (match) {
                gpsData = {
                  latitude: parseFloat(match[1]),
                  longitude: parseFloat(match[2]),
                  altitude: match[3] ? parseFloat(match[3]) : undefined,
                };
                console.log('📍 GPS from ffprobe:', gpsData);
              }
            }

            if (videoStream) {
              metadata = {
                // 비디오 정보
                width: videoStream.width,
                height: videoStream.height,
                duration: parseFloat(ffprobeData.format?.duration || 0),
                bitrate: parseInt(ffprobeData.format?.bit_rate || 0),
                codec: videoStream.codec_name,
                
                // 카메라 정보 (QuickTime 태그에서 추출)
                make: formatTags['com.apple.quicktime.make'] || 'Apple',
                model: formatTags['com.apple.quicktime.model'] || formatTags['com.apple.quicktime.software'],
                
                // 날짜 정보
                dateTimeOriginal: formatTags['creation_time'] || formatTags['com.apple.quicktime.creationdate'],
                createDate: formatTags['creation_time'],
                
                // GPS
                gps: gpsData,
                
                // 기타 정보
                software: formatTags['com.apple.quicktime.software'],
                orientation: videoStream.rotation,
              };

              console.log('🎥 FFprobe metadata:', metadata);
            }
          } catch (ffprobeError) {
            console.warn('⚠️ FFprobe not available:', ffprobeError);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ EXIF extraction failed:', error);
      // Sharp로 기본 메타데이터 추출 시도
      try {
        const sharpMetadata = await sharp(filePath).metadata();
        metadata = {
          width: sharpMetadata.width,
          height: sharpMetadata.height,
          format: sharpMetadata.format,
        };
        console.log('📸 Sharp metadata:', metadata);
      } catch (sharpError) {
        console.warn('⚠️ Sharp metadata extraction failed:', sharpError);
      }
    }

    // 메타데이터 정규화
    const normalizedMetadata = normalizeMetadata(metadata);
    console.log('📸 Normalized metadata:', {
      width: normalizedMetadata.width,
      height: normalizedMetadata.height,
      cameraMake: normalizedMetadata.cameraMake,
      cameraModel: normalizedMetadata.cameraModel,
      takenAt: normalizedMetadata.takenAt,
      iso: normalizedMetadata.iso,
    });

    // 썸네일 생성
    let thumbnailPath = null;

    // 이미지 썸네일
    if (file.type.startsWith('image/')) {
      try {
        const thumbnailDir = path.join(groupDir, 'thumbnails');
        if (!existsSync(thumbnailDir)) {
          await mkdir(thumbnailDir, { recursive: true });
        }

        const thumbnailName = `thumb_${fileName.replace(extension, '.jpg')}`;
        thumbnailPath = path.join(thumbnailDir, thumbnailName);

        // HEIC 파일 특별 처리 - JPEG 썸네일 생성
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          console.log(`🔄 Converting HEIC to JPEG thumbnail...`);

          // heic-converter를 사용하여 JPEG 썸네일 생성
          const thumbnailBuffer = await convertHeicToThumbnail(filePath, 300);

          if (thumbnailBuffer) {
            // 썸네일 버퍼를 파일로 저장
            await writeFile(thumbnailPath, thumbnailBuffer);
            console.log(`✅ HEIC thumbnail saved as JPEG: ${thumbnailPath}`);
          } else {
            console.warn(`⚠️ HEIC thumbnail conversion failed, will generate on-demand`);
            // 썸네일 생성 실패 시 경로는 설정하되 나중에 동적 생성
          }
        } else {
          // 일반 이미지 썸네일 생성
          await sharp(filePath)
            .rotate() // EXIF 회전 정보 적용
            .resize(300, 300, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          console.log(`✅ Image thumbnail generated: ${thumbnailPath}`);
        }
      } catch (error) {
        console.warn('⚠️ Image thumbnail generation failed:', error);
      }
    }

    // 비디오 썸네일 (첫 프레임 캡처) - MOV 파일 포함
    if (file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mov')) {
      try {
        const thumbnailDir = path.join(groupDir, 'thumbnails');
        if (!existsSync(thumbnailDir)) {
          await mkdir(thumbnailDir, { recursive: true });
        }

        const thumbnailName = `thumb_${fileName.replace(extension, '.jpg')}`;
        const finalThumbnailPath = path.join(thumbnailDir, thumbnailName);

        console.log(`🎬 Generating video thumbnail for: ${file.name}`);

        // ffmpeg 명령어로 첫 프레임 추출
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        try {
          // 개선된 ffmpeg 명령어 - MOV 파일과 회전 정보 처리
          // 1초 지점의 프레임 추출 (첫 프레임이 검은색일 수 있음)
          // 자동 회전 적용 (-autorotate 기본값)
          const ffmpegCmd = `ffmpeg -i "${filePath}" -ss 00:00:01 -vframes 1 -vf "scale=600:-1" -q:v 2 "${finalThumbnailPath}"`;

          await execAsync(ffmpegCmd);

          // 썸네일이 생성되었는지 확인
          if (existsSync(finalThumbnailPath)) {
            // Sharp로 최종 리사이즈 및 품질 조정
            const tempBuffer = await readFile(finalThumbnailPath);
            const optimizedBuffer = await sharp(tempBuffer)
              .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 85 })
              .toBuffer();

            // 최적화된 버퍼를 파일로 저장
            await writeFile(finalThumbnailPath, optimizedBuffer);

            thumbnailPath = finalThumbnailPath;
            console.log(`✅ Video thumbnail generated: ${thumbnailPath}`);
          } else {
            console.warn('⚠️ Video thumbnail file not created');
          }
        } catch (ffmpegError) {
          console.warn('⚠️ ffmpeg thumbnail generation failed:', ffmpegError);
          // 실패 시 기본 플레이스홀더 이미지 생성
          try {
            const placeholderBuffer = await sharp({
              create: {
                width: 300,
                height: 300,
                channels: 3,
                background: { r: 44, g: 40, b: 36 },
              },
            })
              .composite([
                {
                  input: Buffer.from(
                    `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100%" height="100%" fill="#2c2824"/>
                  <polygon points="120,100 120,200 200,150" fill="white" opacity="0.7"/>
                </svg>`
                  ),
                  top: 0,
                  left: 0,
                },
              ])
              .jpeg({ quality: 80 })
              .toBuffer();

            await writeFile(finalThumbnailPath, placeholderBuffer);
            thumbnailPath = finalThumbnailPath;
            console.log('⚠️ Video placeholder thumbnail created');
          } catch (placeholderError) {
            console.error('Failed to create video placeholder:', placeholderError);
          }
        }
      } catch (error) {
        console.warn('⚠️ Video thumbnail generation failed:', error);
      }
    }

    // 미디어 정보를 데이터베이스에 저장
    // 상대 경로로 저장 (웹에서 접근 가능한 경로)
    const relativePath = `/uploads/${groupId}/${fileName}`;
    const relativeThumbnailPath = thumbnailPath
      ? `/uploads/${groupId}/thumbnails/thumb_${fileName.replace(extension, '.jpg')}`
      : null;

    // Media 문서 생성
    const mediaData = {
      filename: fileName,
      originalName,
      path: relativePath,
      thumbnailPath: relativeThumbnailPath,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      groupId,
      uploadedBy: decoded.userId,
      status: 'completed' as const,
      metadata: normalizedMetadata,
      uploadedAt: new Date(),
    };

    console.log('📝 Creating media document with data:', {
      filename: mediaData.filename,
      path: mediaData.path,
      groupId: mediaData.groupId,
      status: mediaData.status,
    });

    const media = await Media.create(mediaData);

    if (!media || !media._id) {
      throw new Error('Failed to create media document in database');
    }

    console.log(`✅ Media saved to database: ${media._id}`);

    // 그룹의 미디어 카운트 업데이트
    await Group.findByIdAndUpdate(groupId, {
      $inc: { mediaCount: 1 },
      $set: { updatedAt: new Date() },
    });

    // 검증: 실제로 저장되었는지 확인
    const savedMedia = await Media.findById(media._id);
    if (!savedMedia) {
      console.error('❌ Media was not properly saved to database');
      throw new Error('Media save verification failed');
    }

    console.log(`✅ Media verified in database: ${savedMedia._id}`);

    return NextResponse.json({
      success: true,
      mediaId: media._id,
      filename: originalName,
      size: file.size,
      thumbnailPath: thumbnailPath ? `/api/media/thumbnail/${media._id}` : null,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
