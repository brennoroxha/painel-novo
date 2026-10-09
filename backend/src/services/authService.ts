import bcrypt from 'bcrypt';
import { PrismaClient, User, Role } from '@prisma/client';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWTPayload,
} from '../utils/jwt';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenResponse {
  accessToken: string;
}

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export class AuthService {
  private jwtSecret: string;

  constructor(private prisma: PrismaClient) {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user.id);
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(userId: string): Promise<TokenResponse> {
    const accessToken = generateAccessToken(userId, this.jwtSecret);
    const refreshToken = generateRefreshToken(userId, this.jwtSecret);
    return { accessToken, refreshToken };
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AccessTokenResponse> {
    try {
      const decoded = verifyRefreshToken(refreshToken, this.jwtSecret);
      const accessToken = generateAccessToken(decoded.userId, this.jwtSecret);
      return { accessToken };
    } catch (error) {
      throw new Error(`Failed to refresh token: ${(error as Error).message}`);
    }
  }

  /**
   * Verify and decode an access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = this.decodeAccessToken(token);
      return decoded;
    } catch (error) {
      throw new Error(`Invalid token: ${(error as Error).message}`);
    }
  }

  /**
   * Decode and validate an access token (synchronous)
   */
  decodeAccessToken(token: string): JWTPayload {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // As per spec
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Create a new user with hashed password
   */
  async createUser(email: string, password: string, name: string, role: Role = 'OPERATOR'): Promise<User> {
    const passwordHash = await this.hashPassword(password);
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
      },
    });
  }

  /**
   * Get user info for token payload
   */
  async getUserPayload(userId: string): Promise<UserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
