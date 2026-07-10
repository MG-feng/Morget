export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface JwtPayload {
  userId: string;
  email?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface UserResponse {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  roles: string[]; // Display names only
  storageUsed: number;
  storageQuota: number;
  isBanned: boolean;
  createdAt: Date;
}

export interface FileResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloads: number;
  isPublic: boolean;
  createdAt: Date;
  downloadUrl?: string;
}

export interface TicketResponse {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiPageResponse {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  tags: string[];
  views: number;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const createErrorResponse = (code: string, message: string, details?: any): ApiResponse => ({
  success: false,
  error: { code, message, details },
});

// Error codes
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // File
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  
  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Account
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  ACCOUNT_RESTRICTED: 'ACCOUNT_RESTRICTED',
  
  // Verification
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE',
} as const;
