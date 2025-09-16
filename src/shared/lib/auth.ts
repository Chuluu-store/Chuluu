import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chuluu-secret-key-2024';

export interface TokenPayload {
  userId: string;
  username: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    console.error('[verifyToken] JWT 토큰 검증 실패 :', {
      error: error.name,
      message: error.message,
      tokenPreview: token.substring(0, 20) + '...'
    });
    
    // 만료된 토큰이나 유효하지 않은 서명인 경우 null 반환하여 재로그인 유도
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return null;
    }
    
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  // Authorization 헤더에서 토큰 확인 (Bearer 형식)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // 쿠키에서 토큰 확인
  if ('cookies' in request) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [key, ...values] = c.trim().split('=');
          return [key, values.join('=')];
        })
      );
      if (cookies.token) {
        return cookies.token;
      }
    }
  }

  return null;
}
