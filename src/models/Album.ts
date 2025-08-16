import mongoose from "mongoose";

const AlbumSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String },
  shareId: { type: String, unique: true },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Album || mongoose.model("Album", AlbumSchema);
