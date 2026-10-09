import { Fase3Service } from '../src/services/fase3Service';
import axios from 'axios';
import * as hmacUtils from '../src/utils/hmac';

jest.mock('axios');
jest.mock('../src/utils/hmac');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedHmac = hmacUtils as jest.Mocked<typeof hmacUtils>;

describe('Fase3Service', () => {
  let service: Fase3Service;

  beforeEach(() => {
    // Set environment variables first
    process.env.FASE3_SERVER = '177.153.69.138';
    process.env.FASE3_PORT = '3001';
    process.env.FASE3_API_KEY = 'test-api-key';

    // Mock prisma as a simple object
    const mockPrisma = {
      fase3Log: {
        create: jest.fn().mockResolvedValue({})
      }
    } as any;

    service = new Fase3Service(mockPrisma);

    // Mock HMAC headers function
    mockedHmac.createFASE3Headers.mockReturnValue({
      'x-timestamp': '123456789',
      'x-signature': 'mock-signature',
      'Content-Type': 'application/json'
    });

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should analyze single IP and return verdict', async () => {
    const mockResponse = {
      data: {
        verdict: 'ALLOW',
        risk_score: 10,
        component_scores: {
          proxycheck: 0,
          bot_detection: 0,
          behavioral: 5,
          geolocation: 5
        }
      }
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await service.analyzeIP('192.168.1.1');

    expect(result).toHaveProperty('ip');
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('riskScore');
    expect(['ALLOW', 'BLOCK', 'CHALLENGE', 'UNKNOWN']).toContain(result.verdict);
    expect(result.verdict).toBe('ALLOW');
    expect(result.ip).toBe('192.168.1.1');
  });

  it('should batch analyze multiple IPs', async () => {
    const mockResponse = {
      data: {
        verdict: 'ALLOW',
        risk_score: 10,
        component_scores: {}
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const ips = ['192.168.1.1', '192.168.1.2'];
    const results = await service.analyzeIPs(ips);

    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('verdict');
    expect(results[1]).toHaveProperty('verdict');
  });

  it('should handle FASE3 API errors gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

    const result = await service.analyzeIP('192.168.1.1');

    expect(result.verdict).toBe('UNKNOWN');
    expect(result.riskScore).toBe(0);
  });

  it('should save FASE3 log to database', async () => {
    const mockPrisma = {
      fase3Log: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' })
      }
    } as any;

    const serviceWithMockPrisma = new Fase3Service(mockPrisma);

    const result = {
      ip: '192.168.1.1',
      verdict: 'BLOCK' as const,
      riskScore: 85,
      componentScores: { proxycheck: 20, bot_detection: 30, behavioral: 25, geolocation: 10 },
      timestamp: new Date().toISOString()
    };

    await serviceWithMockPrisma.saveFase3Log('campaign-1', result);

    expect(mockPrisma.fase3Log.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'campaign-1',
        ip: result.ip,
        verdict: result.verdict,
        riskScore: result.riskScore,
        componentScores: result.componentScores,
        analyzedAt: expect.any(Date)
      }
    });
  });
});
