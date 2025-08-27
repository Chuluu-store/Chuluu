const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const exifr = require('exifr');

// MongoDB 연결
const MONGODB_URI = 'mongodb+srv://chan6502:Tmdcks6502%40@chuluu.ku8kp55.mongodb.net/test';

// Media 스키마 정의
const mediaSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  thumbnailPath: String,
  mimeType: String,
  size: Number,
  groupId: mongoose.Schema.Types.ObjectId,
  uploadedBy: mongoose.Schema.Types.ObjectId,
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'completed' },
  metadata: {
    width: Number,
    height: Number,
    takenAt: Date,
    cameraMake: String,
    cameraModel: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  }
});

const Media = mongoose.model('Media', mediaSchema, 'photo_media');

async function recoverMedia() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    const groupId = '68a9daee0cfb5c14f5be16be';
    const userId = '68a9dae70cfb5c14f5be16b6';
    const uploadDir = `/home/pi/uploads/${groupId}`;
    const thumbnailDir = `${uploadDir}/thumbnails`;

    // 업로드 디렉토리의 모든 파일 읽기
    const files = fs.readdirSync(uploadDir).filter(f => !f.startsWith('.') && f !== 'thumbnails');
    console.log(`📁 발견된 파일: ${files.length}개`);

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      
      // 파일이 이미 DB에 있는지 확인
      const existing = await Media.findOne({ filename: file });
      if (existing) {
        console.log(`⏭️  이미 존재: ${file}`);
        continue;
      }

      const stats = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        mimeType = `image/${ext.slice(1).replace('jpg', 'jpeg')}`;
      } else if (['.mp4', '.mov', '.avi', '.wmv'].includes(ext)) {
        mimeType = `video/${ext.slice(1)}`;
      }

      // EXIF 메타데이터 추출
      let metadata = {};
      let takenAt = null;
      
      if (mimeType.startsWith('image/')) {
        try {
          const exifData = await exifr.parse(filePath);
          if (exifData) {
            metadata = {
              width: exifData.ImageWidth || exifData.ExifImageWidth,
              height: exifData.ImageHeight || exifData.ExifImageHeight,
              cameraMake: exifData.Make,
              cameraModel: exifData.Model,
              takenAt: exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate
            };
            takenAt = metadata.takenAt;
          }
        } catch (e) {
          console.log(`⚠️  EXIF 추출 실패: ${file}`);
        }
      }

      // 파일명에서 날짜 추출 시도
      if (!takenAt) {
        const dateMatch = file.match(/(\d{13})/);
        if (dateMatch) {
          takenAt = new Date(parseInt(dateMatch[1]));
        } else {
          takenAt = stats.mtime;
        }
      }

      // 썸네일 경로 확인
      const thumbnailFileName = `thumb_${file.replace(ext, '.jpg')}`;
      const thumbnailPath = fs.existsSync(path.join(thumbnailDir, thumbnailFileName))
        ? `/uploads/${groupId}/thumbnails/${thumbnailFileName}`
        : null;

      // MongoDB에 저장
      const media = await Media.create({
        filename: file,
        originalName: file,
        path: `/uploads/${groupId}/${file}`,
        thumbnailPath,
        mimeType,
        size: stats.size,
        groupId: new mongoose.Types.ObjectId(groupId),
        uploadedBy: new mongoose.Types.ObjectId(userId),
        uploadedAt: stats.mtime,
        status: 'completed',
        metadata: {
          ...metadata,
          takenAt: takenAt || stats.mtime
        }
      });

      console.log(`✅ 복구 완료: ${file} (ID: ${media._id})`);
    }

    // 그룹의 미디어 카운트 업데이트
    const Group = mongoose.model('Group', new mongoose.Schema({
      mediaCount: Number
    }), 'groups');
    
    const mediaCount = await Media.countDocuments({ groupId });
    await Group.findByIdAndUpdate(groupId, { mediaCount });
    
    console.log(`\n✨ 총 ${mediaCount}개 미디어 복구 완료!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

recoverMedia();