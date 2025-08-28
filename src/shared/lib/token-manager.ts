/**
 * 토큰 관리 유틸리티
 */

/**
 * 만료된 토큰 자동 정리
 */
export function clearExpiredToken(): void {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    // JWT payload 디코딩 (클라이언트에서는 검증 없이 만료 시간만 확인)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // 토큰이 만료되었으면 로컬 스토리지에서 제거
    if (payload.exp && payload.exp < now) {
      console.log('[clearExpiredToken] 만료된 토큰 자동 정리');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 로그인 페이지로 리다이렉트 (현재 페이지가 인증이 필요한 경우)
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  } catch (error) {
    console.error('[clearExpiredToken] 토큰 정리 중 오류 :', error);
    // 토큰이 손상된 경우에도 정리
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

/**
 * API 요청 전에 토큰 유효성 체크
 */
export function isTokenValid(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp && payload.exp > now;
  } catch (error) {
    console.error('[isTokenValid] 토큰 유효성 체크 실패 :', error);
    return false;
  }
}

/**
 * 토큰 갱신이 필요한지 체크 (만료 1시간 전)
 */
export function shouldRefreshToken(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60; // 1시간
    
    return payload.exp && (payload.exp - now) < oneHour;
  } catch (error) {
    console.error('[shouldRefreshToken] 토큰 갱신 체크 실패 :', error);
    return false;
  }
}

/**
 * 주기적으로 토큰 상태 체크
 */
export function startTokenMonitoring(): void {
  // 5분마다 토큰 상태 체크
  const interval = setInterval(() => {
    if (!isTokenValid()) {
      clearExpiredToken();
      clearInterval(interval);
    }
  }, 5 * 60 * 1000); // 5분

  // 페이지 언로드 시 interval 정리
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
}