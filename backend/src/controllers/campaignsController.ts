import { Response } from 'express';
import { CampaignService } from '../services/campaignService';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export class CampaignController {
  private campaignService: CampaignService;

  constructor(prisma: PrismaClient) {
    this.campaignService = new CampaignService(prisma);
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaigns = await this.campaignService.getCampaigns(userId);
      res.json({ data: campaigns });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async get(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaign = await this.campaignService.getCampaign(req.params.id, userId);
      res.json({ data: campaign });
    } catch (error) {
      res.status(404).json({ error: 'Campaign not found' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaign = await this.campaignService.createCampaign(userId, req.body);
      res.status(201).json({ data: campaign });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaign = await this.campaignService.updateCampaign(req.params.id, userId, req.body);
      res.json({ data: campaign });
    } catch (error) {
      res.status(404).json({ error: 'Campaign not found' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      await this.campaignService.deleteCampaign(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: 'Campaign not found' });
    }
  }
}
