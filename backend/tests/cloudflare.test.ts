import { CloudflareService } from '../src/services/cloudflareService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CloudflareService', () => {
  let service: CloudflareService;
  let mockPrisma: any;

  beforeEach(() => {
    // Use fake timers to skip sleep delays
    jest.useFakeTimers();

    // Set environment variables
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id';
    process.env.CLOUDFLARE_API_TOKEN = 'test-api-token';
    process.env.CLOUDFLARE_ZONE_ID_FILTRAPRO = 'zone-filtrapro-id';

    // Mock prisma with dynamic response
    mockPrisma = {
      campaignDomain: {
        create: jest.fn().mockImplementation((input) =>
          Promise.resolve({
            id: 'domain-1',
            domain: input.data.domain,
            zoneId: input.data.zoneId,
            customHostnameId: input.data.customHostnameId,
            status: input.data.status
          })
        )
      }
    };

    service = new CloudflareService(mockPrisma);

    // Mock axios.create to return a mocked axios instance
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { baseURL: '', headers: {} }
    } as any);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should detect zone for filtrapro.app subdomain', async () => {
    const zoneId = await service.detectZone('campaign1.filtrapro.app');
    expect(zoneId).toBe(process.env.CLOUDFLARE_ZONE_ID_FILTRAPRO);
  });

  it('should register custom hostname on Cloudflare', async () => {
    jest.useRealTimers();
    const mockAxiosInstance = {
      post: jest.fn().mockResolvedValue({
        data: {
          result: {
            id: 'custom-host-id-123',
            hostname: 'test.filtrapro.app',
            status: 'pending'
          }
        }
      })
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    service = new CloudflareService(mockPrisma);

    const customHostnameId = await service.registerCustomHostname(
      'zone-filtrapro-id',
      'test.filtrapro.app'
    );

    expect(customHostnameId).toBe('custom-host-id-123');
  }, 60000); // Increased timeout for sleep

  it('should create worker route', async () => {
    const mockAxiosInstance = {
      post: jest.fn().mockResolvedValue({
        data: {
          result: {
            id: 'route-id-456',
            pattern: 'test.filtrapro.app/*'
          }
        }
      })
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    service = new CloudflareService(mockPrisma);

    const routeId = await service.createWorkerRoute(
      'zone-filtrapro-id',
      'test.filtrapro.app'
    );

    expect(routeId).toBe('route-id-456');
  });

  it('should complete 3-step domain addition flow', async () => {
    jest.useRealTimers();
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn()
        .mockResolvedValueOnce({
          data: {
            result: {
              id: 'custom-host-id-123',
              hostname: 'newcampaign.filtrapro.app'
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            result: {
              id: 'route-id-456',
              pattern: 'newcampaign.filtrapro.app/*'
            }
          }
        })
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    service = new CloudflareService(mockPrisma);

    const result = await service.addDomain('campaign-123', 'newcampaign.filtrapro.app');

    expect(result).toHaveProperty('hostname');
    expect(result).toHaveProperty('customHostnameId');
    expect(result).toHaveProperty('workerRoute');
    expect(result.status).toBe('ACTIVE');
    expect(result.hostname).toBe('newcampaign.filtrapro.app');
  }, 60000); // Increased timeout for sleep

  it('should throw error for invalid domain', async () => {
    await expect(service.detectZone('invalid-domain.unknown')).rejects.toThrow();
  });
});
