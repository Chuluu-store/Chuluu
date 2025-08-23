import { Schema, model, models } from "mongoose";
import { Media } from "./types";

const MediaSchema = new Schema<Media>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  type: { type: String, enum: ["image", "video"], required: true },
  metadata: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    duration: { type: Number },
    exif: { type: Schema.Types.Mixed },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    dateTaken: { type: Date },
  },
  thumbnails: {
    small: { type: String, required: true },
    medium: { type: String, required: true },
    large: { type: String, required: true },
  },
  albumId: { type: Schema.Types.ObjectId, ref: "Album" },
  uploadedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
MediaSchema.pre("save", function () {
  this.updatedAt = new Date();
});

// Create indexes
MediaSchema.index({ albumId: 1 });
MediaSchema.index({ type: 1 });
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ "metadata.dateTaken": -1 });

export const MediaModel = models.Media || model<Media>("Media", MediaSchema);
