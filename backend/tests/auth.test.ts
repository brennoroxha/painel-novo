import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/utils/jwt';
import { authMiddleware } from '../src/middleware/authMiddleware';

describe('JWT Utils', () => {
  const userId = 'test-user-123';
  const secret = 'test-secret-key';

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(userId, secret);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // Should be decodable
      const decoded = verifyAccessToken(token, secret);
      expect(decoded.userId).toBe(userId);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(userId, secret);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid access token', () => {
      const token = generateAccessToken(userId, secret);
      const decoded = verifyAccessToken(token, secret);
      expect(decoded.userId).toBe(userId);
    });

    it('should throw on invalid secret', () => {
      const token = generateAccessToken(userId, secret);
      expect(() => verifyAccessToken(token, 'wrong-secret')).toThrow();
    });

    it('should throw on malformed token', () => {
      expect(() => verifyAccessToken('invalid.token.format', secret)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const token = generateRefreshToken(userId, secret);
      const decoded = verifyRefreshToken(token, secret);
      expect(decoded.userId).toBe(userId);
    });

    it('should reject access token as refresh token', () => {
      const token = generateAccessToken(userId, secret);
      expect(() => verifyRefreshToken(token, secret)).toThrow();
    });

    it('should throw on invalid secret', () => {
      const token = generateRefreshToken(userId, secret);
      expect(() => verifyRefreshToken(token, 'wrong-secret')).toThrow();
    });
  });
});

describe('Auth Middleware', () => {
  const secret = 'test-secret-key';
  const userId = 'test-user-123';

  it('should reject request without token', () => {
    const req = { headers: {} } as any;
    const statusMock = jest.fn().mockReturnThis();
    const res = { status: statusMock, json: jest.fn() } as any;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should accept valid token and set user on request', () => {
    const token = generateAccessToken(userId, secret);
    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const res = {} as any;
    const next = jest.fn();

    // Mock process.env.JWT_SECRET
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;

    authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe(userId);
    expect(next).toHaveBeenCalled();

    process.env.JWT_SECRET = originalSecret;
  });

  it('should reject invalid token', () => {
    const req = { headers: { authorization: 'Bearer invalid.token.here' } } as any;
    const statusMock = jest.fn().mockReturnThis();
    const res = { status: statusMock, json: jest.fn() } as any;
    const next = jest.fn();

    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();

    process.env.JWT_SECRET = originalSecret;
  });

  it('should reject request with malformed authorization header', () => {
    const req = { headers: { authorization: 'InvalidFormat token' } } as any;
    const statusMock = jest.fn().mockReturnThis();
    const res = { status: statusMock, json: jest.fn() } as any;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
