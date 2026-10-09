import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new AuthController(prisma);
const router = Router();

// Public routes
router.post('/login', (req, res) => controller.login(req, res));
router.post('/refresh', (req, res) => controller.refreshToken(req, res));
router.post('/verify', (req, res) => controller.verifyToken(req, res));

// Protected routes
router.get('/me', authMiddleware, (req, res) => controller.getCurrentUser(req, res));

export default router;
