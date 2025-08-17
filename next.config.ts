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
      {
        protocol: 'https',
        hostname: 'chuluu.store',
      },
    ],
  },
  // 파일 업로드를 위한 설정
  serverExternalPackages: ['sharp', 'exifr'],
  // API 라우트 설정
  async headers() {
    return [
      {
        source: '/api/upload/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
