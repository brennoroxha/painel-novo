// Re-export Prisma types for use throughout the application
export type {
  User,
  Campaign,
  CampaignDomain,
  CampaignStats,
  Fase3Log,
  CampaignLink,
  AuditLog,
} from '@prisma/client';

export { Role, Status, DomainStatus, Verdict } from '@prisma/client';

// Custom API types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Fase3AnalysisResult {
  ip: string;
  verdict: 'ALLOW' | 'BLOCK' | 'CHALLENGE' | 'UNKNOWN';
  riskScore: number;
  isHeadless: boolean;
  country?: string;
  deviceType?: string;
  canvasFingerprint?: string;
  webglFingerprint?: string;
  componentScores?: Record<string, number>;
  blindagemFlags?: Record<string, boolean>;
}

export interface CloudflareDomainAddStep {
  step: number;
  status: 'pending' | 'success' | 'failed';
  message: string;
  zoneId?: string;
  customHostnameId?: string;
}

export interface WebSocketMessage {
  event: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface UserContext {
  userId: string;
  email: string;
  role: string;
  name: string;
}
