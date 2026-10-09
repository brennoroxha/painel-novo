import { Role } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email?: string;
  role?: Role;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}
