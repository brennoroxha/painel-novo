import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../src/middleware/authMiddleware';
import { CampaignController } from '../src/controllers/campaignsController';
import { generateAccessToken } from '../src/utils/jwt';

// Mock express app for testing
const app = express();
app.use(express.json());

// Initialize prisma mock
const mockPrisma = {
  campaign: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
} as any;

// Setup campaign routes
const controller = new CampaignController(mockPrisma);
const router = Router();
router.use(authMiddleware);
router.get('/', (req, res) => controller.list(req as any, res));
router.get('/:id', (req, res) => controller.get(req as any, res));
router.post('/', (req, res) => controller.create(req as any, res));
router.put('/:id', (req, res) => controller.update(req as any, res));
router.delete('/:id', (req, res) => controller.delete(req as any, res));

app.use('/api/campaigns', router);

describe('Campaign Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  it('should list campaigns for authenticated user', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findMany.mockResolvedValue([
      { id: 'campaign-1', name: 'Campaign 1', userId: 'user-123' }
    ]);

    const response = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should create campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.create.mockResolvedValue({
      id: 'campaign-new',
      name: 'Test Campaign',
      userId: 'user-123'
    });

    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Campaign', description: 'Testing' });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeDefined();
  });

  it('should reject unauthenticated request', async () => {
    const response = await request(app).get('/api/campaigns');
    expect(response.status).toBe(401);
  });

  it('should get single campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      name: 'Campaign 1',
      userId: 'user-123'
    });

    const response = await request(app)
      .get('/api/campaigns/campaign-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('campaign-1');
  });

  it('should update campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      name: 'Campaign 1',
      userId: 'user-123'
    });
    mockPrisma.campaign.update.mockResolvedValue({
      id: 'campaign-1',
      name: 'Updated Campaign',
      userId: 'user-123'
    });

    const response = await request(app)
      .put('/api/campaigns/campaign-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Campaign' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Updated Campaign');
  });

  it('should delete campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      name: 'Campaign 1',
      userId: 'user-123'
    });
    mockPrisma.campaign.delete.mockResolvedValue({
      id: 'campaign-1'
    });

    const response = await request(app)
      .delete('/api/campaigns/campaign-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/campaigns/nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
