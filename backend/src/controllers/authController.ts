import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/authService';

export class AuthController {
  private authService: AuthService;

  constructor(private prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  /**
   * Login user with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const tokens = await this.authService.login(email, password);
      res.status(200).json(tokens);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message || 'Authentication failed' });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      const result = await this.authService.refreshAccessToken(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message || 'Token refresh failed' });
    }
  }

  /**
   * Verify current token
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization header is required' });
        return;
      }

      const token = authHeader.substring(7);
      const payload = await this.authService.verifyAccessToken(token);
      res.status(200).json({ valid: true, payload });
    } catch (error) {
      res.status(401).json({ error: (error as Error).message || 'Token verification failed' });
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId; // Set by authMiddleware

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userPayload = await this.authService.getUserPayload(userId);
      res.status(200).json(userPayload);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message || 'User not found' });
    }
  }
}
