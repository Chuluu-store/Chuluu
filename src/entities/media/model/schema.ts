import mongoose from 'mongoose';
import type { MediaItem } from '@/shared/types';

const MediaSchema = new mongoose.Schema<MediaItem>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  thumbnail: { type: String },
  metadata: {
    width: Number,
    height: Number,
    dateTaken: Date,
    camera: String,
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  isVideo: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

MediaSchema.index({ uploadedAt: -1 });
MediaSchema.index({ albumId: 1 });
MediaSchema.index({ isVideo: 1 });
MediaSchema.index({ groupId: 1 });
MediaSchema.index({ uploadedBy: 1 });

export const MediaModel = mongoose.models.Media || mongoose.model<MediaItem>('Media', MediaSchema);
