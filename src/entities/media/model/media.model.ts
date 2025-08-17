import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  groupId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // 동영상의 경우
    exif?: any; // EXIF 데이터
    takenAt?: Date; // 실제 촬영 날짜
    cameraMake?: string; // 카메라 제조사
    cameraModel?: string; // 카메라 모델
    location?: {
      latitude?: number;
      longitude?: number;
    }; // GPS 정보
  };
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const MediaSchema = new Schema<IMedia>({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    exif: Schema.Types.Mixed,
    takenAt: Date,
    cameraMake: String,
    cameraModel: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed'],
    default: 'uploading'
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

// 인덱스 설정
MediaSchema.index({ groupId: 1, 'metadata.takenAt': -1 }); // 촬영날짜 기준 정렬
MediaSchema.index({ groupId: 1, uploadedAt: -1 }); // 업로드날짜 기준 정렬
MediaSchema.index({ uploadedBy: 1, uploadedAt: -1 });
MediaSchema.index({ status: 1 });

export const Media = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema, 'media_items');