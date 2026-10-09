import { Router } from 'express';
import { Fase3Controller } from '../controllers/fase3Controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';

const controller = new Fase3Controller(prisma);
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/analyze', (req, res) => controller.analyze(req as any, res));
router.get('/logs', (req, res) => controller.getLogs(req as any, res));

export default router;
