import { Response } from 'express';
import { CloudflareService } from '../services/cloudflareService';
import { CampaignService } from '../services/campaignService';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export class DomainController {
  private cloudflareService: CloudflareService;
  private campaignService: CampaignService;

  constructor(private prisma: PrismaClient) {
    this.cloudflareService = new CloudflareService(prisma);
    this.campaignService = new CampaignService(prisma);
  }

  async addDomain(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;
      const { domain } = req.body;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      // Add domain (3-step process)
      const result = await this.cloudflareService.addDomain(campaignId, domain);

      res.status(201).json({ data: result });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async listDomains(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      const domains = await this.prisma.campaignDomain.findMany({
        where: { campaignId }
      });

      res.json({ data: domains });
    } catch (error) {
      res.status(404).json({ error: 'Campaign not found' });
    }
  }

  async removeDomain(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { campaignId, domainId } = req.params;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      const domain = await this.prisma.campaignDomain.delete({
        where: { id: domainId }
      });

      res.json({ data: domain });
    } catch (error) {
      res.status(404).json({ error: 'Domain not found' });
    }
  }
}
