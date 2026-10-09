import { Response } from 'express';
import { Fase3Service } from '../services/fase3Service';
import { CampaignService } from '../services/campaignService';
import { AuditService } from '../services/auditService';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export class Fase3Controller {
  private fase3Service: Fase3Service;
  private campaignService: CampaignService;
  private auditService: AuditService;

  constructor(private prisma: PrismaClient) {
    this.fase3Service = new Fase3Service(prisma);
    this.campaignService = new CampaignService(prisma);
    this.auditService = new AuditService(prisma);
  }

  async analyze(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;
      const { ips } = req.body;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      if (!Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json({ error: 'IPs array required' });
      }

      // Analyze IPs
      const results = await this.fase3Service.analyzeIPs(ips);

      // Save results
      for (const result of results) {
        await this.fase3Service.saveFase3Log(campaignId, result);
      }

      // Audit log
      await this.auditService.logAction(
        userId,
        'ANALYZE_IPS',
        'CAMPAIGN',
        campaignId,
        { ipsCount: ips.length }
      );

      res.json({ data: results });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;
      const { skip = 0, take = 20 } = req.query;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      const logs = await this.prisma.fase3Log.findMany({
        where: { campaignId },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { analyzedAt: 'desc' }
      });

      res.json({ data: logs });
    } catch (error) {
      res.status(404).json({ error: 'Campaign not found' });
    }
  }
}
