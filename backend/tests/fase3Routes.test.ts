import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import axios from 'axios';
import { authMiddleware } from '../src/middleware/authMiddleware';
import { Fase3Controller } from '../src/controllers/fase3Controller';
import { generateAccessToken } from '../src/utils/jwt';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock express app for testing
let app: any;

// Initialize prisma mock
const mockPrisma = {
  campaign: {
    findFirst: jest.fn(),
  },
  fase3Log: {
    findMany: jest.fn(),
    create: jest.fn()
  },
  auditLog: {
    create: jest.fn()
  }
} as any;

describe('FASE3 Routes', () => {
  let controller: Fase3Controller;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.FASE3_SERVER = 'localhost';
    process.env.FASE3_PORT = '3001';
    process.env.FASE3_API_KEY = 'test-api-key';

    // Setup FASE3 routes after mock is configured
    app = express();
    app.use(express.json());

    controller = new Fase3Controller(mockPrisma);
    const router = Router({ mergeParams: true });
    router.use(authMiddleware);
    router.post('/analyze', (req, res) => controller.analyze(req as any, res));
    router.get('/logs', (req, res) => controller.getLogs(req as any, res));

    app.use('/api/campaigns/:campaignId/fase3', router);
  });

  it('should analyze IPs and return results', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);

    // Mock axios.post for FASE3 API calls
    mockedAxios.post.mockResolvedValue({
      data: {
        verdict: 'ALLOW',
        risk_score: 0,
        component_scores: {
          proxycheck: 0,
          bot_detection: 0,
          behavioral: 0,
          geolocation: 0
        }
      }
    });

    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      userId: 'user-123'
    });

    mockPrisma.fase3Log.create.mockResolvedValue({
      id: 'log-1',
      ip: '192.168.1.1',
      verdict: 'ALLOW',
      riskScore: 0,
      analyzedAt: new Date()
    });

    mockPrisma.auditLog.create.mockResolvedValue({
      id: 'audit-1',
      action: 'ANALYZE_IPS'
    });

    const response = await request(app)
      .post('/api/campaigns/campaign-1/fase3/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ ips: ['192.168.1.1', '10.0.0.1'] });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should reject empty IP list', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);

    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      userId: 'user-123'
    });

    const response = await request(app)
      .post('/api/campaigns/campaign-1/fase3/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ ips: [] });

    expect(response.status).toBe(400);
  });

  it('should get FASE3 logs for campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);

    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      userId: 'user-123'
    });

    mockPrisma.fase3Log.findMany.mockResolvedValue([
      { id: 'log-1', ip: '192.168.1.1', verdict: 'SAFE', risk: 0 },
      { id: 'log-2', ip: '10.0.0.1', verdict: 'RISKY', risk: 75 }
    ]);

    const response = await request(app)
      .get('/api/campaigns/campaign-1/fase3/logs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(2);
  });

  it('should reject unauthenticated FASE3 request', async () => {
    const response = await request(app)
      .post('/api/campaigns/campaign-1/fase3/analyze')
      .send({ ips: ['192.168.1.1'] });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/campaigns/campaign-1/fase3/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ ips: ['192.168.1.1'] });

    expect(response.status).toBe(400);
  });
});
