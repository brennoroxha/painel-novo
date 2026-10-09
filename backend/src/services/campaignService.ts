import { PrismaClient } from '@prisma/client';

export class CampaignService {
  constructor(private prisma: PrismaClient) {}

  async getCampaigns(userId: string, skip: number = 0, take: number = 20): Promise<any[]> {
    return this.prisma.campaign.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCampaign(id: string, userId: string): Promise<any> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId }
    });

    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async createCampaign(
    userId: string,
    data: { name: string; description?: string }
  ): Promise<any> {
    return this.prisma.campaign.create({
      data: {
        userId,
        ...data,
        status: 'ACTIVE'
      }
    });
  }

  async updateCampaign(
    id: string,
    userId: string,
    data: Partial<any>
  ): Promise<any> {
    const campaign = await this.getCampaign(id, userId);

    return this.prisma.campaign.update({
      where: { id },
      data
    });
  }

  async deleteCampaign(id: string, userId: string): Promise<void> {
    await this.getCampaign(id, userId);
    await this.prisma.campaign.delete({ where: { id } });
  }
}
