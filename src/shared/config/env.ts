export const env = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/chuluu",
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  UPLOAD_PATH: process.env.UPLOAD_PATH || "./public/uploads",
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "500MB",
} as const;
