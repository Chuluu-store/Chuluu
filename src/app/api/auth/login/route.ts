import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { signToken } from '../../../../shared/lib/auth';
import { connectDB } from '../../../../shared/lib/database';
import { User } from '../../../../entities/user/model/user.model';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요' }, { status: 400 });
    }

    // 사용자 찾기 (이메일로)
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다' }, { status: 401 });
    }

    // JWT 토큰 생성
    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
    });

    // 응답 with 쿠키
    const response = NextResponse.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        groups: [],
      },
    });

    // 쿠키에 토큰 저장 (httpOnly 제거로 JavaScript 접근 허용)
    response.cookies.set('token', token, {
      httpOnly: false, // JavaScript에서 접근 가능하도록 변경
      secure: process.env.NODE_ENV === 'production', // 프로덕션에서 HTTPS 사용
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/', // 전체 사이트에서 접근 가능하도록 설정
      // domain 설정 제거 (자동으로 현재 도메인 사용)
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '로그인 중 오류가 발생했습니다' }, { status: 500 });
  }
}
