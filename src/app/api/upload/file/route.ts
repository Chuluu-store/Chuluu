import { NextRequest, NextResponse } from "next/server";

// 이 엔드포인트는 더 이상 사용하지 않습니다. /api/upload/direct를 사용하세요.
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error:
        "이 엔드포인트는 더 이상 사용되지 않습니다. /api/upload/direct를 사용하세요.",
    },
    { status: 410 }
  );
}
