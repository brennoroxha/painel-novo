import { Router } from 'express';
import { DomainController } from '../controllers/domainsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new DomainController(prisma);
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', (req, res) => controller.addDomain(req as any, res));
router.get('/', (req, res) => controller.listDomains(req as any, res));
router.delete('/:domainId', (req, res) => controller.removeDomain(req as any, res));

export default router;
