/**
 * 표준화된 API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

/**
 * API 성공 응답 타입
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}