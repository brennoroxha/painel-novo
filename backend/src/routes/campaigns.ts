import { Router } from 'express';
import { CampaignController } from '../controllers/campaignsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new CampaignController(prisma);
const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => controller.list(req as any, res));
router.get('/:id', (req, res) => controller.get(req as any, res));
router.post('/', (req, res) => controller.create(req as any, res));
router.put('/:id', (req, res) => controller.update(req as any, res));
router.delete('/:id', (req, res) => controller.delete(req as any, res));

export default router;
