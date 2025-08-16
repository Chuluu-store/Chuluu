import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema({
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
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
});

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
