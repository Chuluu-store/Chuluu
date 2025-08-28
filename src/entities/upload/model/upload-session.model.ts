import mongoose, { Document, Schema } from 'mongoose';

export interface IUploadSession extends Document {
  sessionId: string;
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: 'initializing' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  files: {
    originalName: string;
    size: number;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
    mediaId?: mongoose.Types.ObjectId;
    error?: string;
    progress?: number;
  }[];
  metadata: {
    totalSize: number;
    estimatedTime?: number;
    avgFileSize: number;
  };
}

const UploadSessionSchema = new Schema<IUploadSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalFiles: {
      type: Number,
      required: true,
    },
    completedFiles: {
      type: Number,
      default: 0,
    },
    failedFiles: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['initializing', 'uploading', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'initializing',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    files: [
      {
        originalName: { type: String, required: true },
        size: { type: Number, required: true },
        status: {
          type: String,
          enum: ['pending', 'uploading', 'processing', 'completed', 'failed'],
          default: 'pending',
        },
        mediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
        error: String,
        progress: { type: Number, default: 0 },
      },
    ],
    metadata: {
      totalSize: { type: Number, required: true },
      estimatedTime: Number,
      avgFileSize: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
UploadSessionSchema.index({ userId: 1, startedAt: -1 });
UploadSessionSchema.index({ groupId: 1, startedAt: -1 });
UploadSessionSchema.index({ status: 1 });

export const UploadSession =
  mongoose.models.UploadSession ||
  mongoose.model<IUploadSession>('UploadSession', UploadSessionSchema, 'upload_sessions');
