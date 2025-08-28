import { NextRequest, NextResponse } from 'next/server';

// 앨범 기능은 현재 구현되지 않았습니다
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: '앨범 기능은 현재 구현되지 않았습니다' }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: '앨범 기능은 현재 구현되지 않았습니다' }, { status: 501 });
}
