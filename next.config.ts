import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export는 API 라우트와 호환되지 않으므로 제거
  // 대신 standalone 모드 사용
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
