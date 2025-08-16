export const env = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/chuluu",
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;
