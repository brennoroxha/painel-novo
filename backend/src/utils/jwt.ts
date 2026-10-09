import * as jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export function generateAccessToken(
  userId: string,
  secret: string,
  expiresIn: string = '1h'
): string {
  const payload: JWTPayload = { userId };
  return jwt.sign(payload, secret, { expiresIn });
}

export function generateRefreshToken(
  userId: string,
  secret: string,
  expiresIn: string = '24h'
): string {
  const payload: RefreshTokenPayload = {
    userId,
    type: 'refresh',
  };
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token: string, secret: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error(`Invalid access token: ${(error as Error).message}`);
  }
}

export function verifyRefreshToken(token: string, secret: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, secret) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw new Error('Token is not a refresh token');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error(`Invalid refresh token: ${(error as Error).message}`);
  }
}
