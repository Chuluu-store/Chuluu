import mongoose, { Schema, model, models } from "mongoose";
import { Album } from "./types";

const AlbumSchema = new Schema<Album>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  coverImage: { type: String },
  mediaCount: { type: Number, default: 0 },
  shareToken: { type: String, unique: true, sparse: true },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
AlbumSchema.pre("save", function () {
  this.updatedAt = new Date();
});

// Create indexes
AlbumSchema.index({ createdAt: -1 });
AlbumSchema.index({ isPublic: 1 });

// Generate share token when needed
AlbumSchema.methods.generateShareToken = function () {
  this.shareToken =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return this.shareToken;
};

export const AlbumModel = models.Album || model<Album>("Album", AlbumSchema);
