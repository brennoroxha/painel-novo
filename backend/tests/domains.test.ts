import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { authMiddleware } from '../src/middleware/authMiddleware';
import { DomainController } from '../src/controllers/domainsController';
import { generateAccessToken } from '../src/utils/jwt';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock express app for testing
let app: any;

// Initialize prisma mock
const mockPrisma = {
  campaign: {
    findFirst: jest.fn(),
  },
  campaignDomain: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn()
  }
} as any;

describe('Domain Routes', () => {
  let mockAxiosInstance: any;
  let controller: DomainController;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id';
    process.env.CLOUDFLARE_API_TOKEN = 'test-api-token';
    process.env.CLOUDFLARE_ZONE_ID_FILTRAPRO = 'zone-filtrapro-id';

    // Mock axios.create to return a mocked instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { baseURL: '', headers: {} }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Setup domain routes after mock is configured
    app = express();
    app.use(express.json());

    controller = new DomainController(mockPrisma);
    const router = Router({ mergeParams: true });
    router.use(authMiddleware);
    router.post('/', (req, res) => controller.addDomain(req as any, res));
    router.get('/', (req, res) => controller.listDomains(req as any, res));
    router.delete('/:domainId', (req, res) => controller.removeDomain(req as any, res));

    app.use('/api/campaigns/:campaignId/domains', router);
  });

  it('should add domain to campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);

    // Configure CloudflareService axios calls
    mockAxiosInstance.post = jest.fn()
      .mockResolvedValueOnce({
        data: {
          result: {
            id: 'ch-123',
            hostname: 'test.filtrapro.app',
            status: 'pending'
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          result: {
            id: 'route-456',
            pattern: 'test.filtrapro.app/*'
          }
        }
      });

    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      userId: 'user-123'
    });
    mockPrisma.campaignDomain.create.mockResolvedValue({
      id: 'domain-1',
      domain: 'test.filtrapro.app',
      campaignId: 'campaign-1',
      zoneId: 'zone-filtrapro-id',
      customHostnameId: 'ch-123',
      status: 'ACTIVE'
    });

    const response = await request(app)
      .post('/api/campaigns/campaign-1/domains')
      .set('Authorization', `Bearer ${token}`)
      .send({ domain: 'test.filtrapro.app' });

    expect(response.status).toBe(201);
    expect(response.body.data.hostname).toBe('test.filtrapro.app');
  });

  it('should list domains for campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      userId: 'user-123'
    });
    mockPrisma.campaignDomain.findMany.mockResolvedValue([
      { id: 'domain-1', domain: 'test1.filtrapro.app', campaignId: 'campaign-1' },
      { id: 'domain-2', domain: 'test2.filtrapro.app', campaignId: 'campaign-1' }
    ]);

    const response = await request(app)
      .get('/api/campaigns/campaign-1/domains')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(2);
  });

  it('should remove domain from campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue({
      id: 'campaign-1',
      userId: 'user-123'
    });
    mockPrisma.campaignDomain.delete.mockResolvedValue({
      id: 'domain-1',
      domain: 'test.filtrapro.app'
    });

    const response = await request(app)
      .delete('/api/campaigns/campaign-1/domains/domain-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('domain-1');
  });

  it('should reject unauthenticated domain request', async () => {
    const response = await request(app)
      .get('/api/campaigns/campaign-1/domains');
    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    mockPrisma.campaign.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/campaigns/nonexistent/domains')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
