import { NextResponse } from 'next/server';
import { ApiResponse, ApiErrorResponse, ApiSuccessResponse } from '../types/api-response';

/**
 * 표준화된 API 성공 응답 생성 헬퍼
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * 표준화된 API 에러 응답 생성 헬퍼
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  message?: string
): NextResponse<ApiErrorResponse> {
  console.error('[API Error]', error, ':', { status, message });
  
  return NextResponse.json(
    {
      success: false,
      error,
      message,
      statusCode: status,
    },
    { status }
  );
}

/**
 * 페이지네이션과 함께 성공 응답 생성
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
    { status: 200 }
  );
}

/**
 * 자주 사용되는 HTTP 상태 코드 상수
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * 자주 사용되는 에러 메시지
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다',
  FORBIDDEN: '권한이 없습니다',
  NOT_FOUND: '리소스를 찾을 수 없습니다',
  BAD_REQUEST: '잘못된 요청입니다',
  INTERNAL_ERROR: '서버 내부 오류가 발생했습니다',
  INVALID_TOKEN: '유효하지 않은 토큰입니다',
  EXPIRED_TOKEN: '만료된 토큰입니다',
  MISSING_FIELDS: '필수 필드가 누락되었습니다',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다',
} as const;