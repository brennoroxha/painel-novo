import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

export class CloudflareService {
  private accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  private apiToken = process.env.CLOUDFLARE_API_TOKEN!;
  private filtrapZoneId = process.env.CLOUDFLARE_ZONE_ID_FILTRAPRO!;
  private cnameTarget = 'filtrapro.app';
  private workerScript = 'workerbn7cerebroprincipalnovo';

  private axiosInstance: AxiosInstance;

  constructor(private prisma: PrismaClient) {
    this.axiosInstance = axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async detectZone(domain: string): Promise<string> {
    // Step 1: Detect Zone
    if (domain.endsWith('.filtrapro.app')) {
      return this.filtrapZoneId;
    }

    // Try to find zone for independent domain
    try {
      const response = await this.axiosInstance.get('/zones', {
        params: { name: domain }
      });

      if (response.data.result && response.data.result.length > 0) {
        return response.data.result[0].id;
      }
    } catch (error) {
      console.error(`Failed to detect zone for ${domain}:`, error);
    }

    throw new Error(`Zone not found for domain ${domain}`);
  }

  async registerCustomHostname(zoneId: string, domain: string): Promise<string> {
    // Step 2: Register Custom Hostname
    try {
      const response = await this.axiosInstance.post(`/zones/${zoneId}/custom_hostnames`, {
        hostname: domain,
        ssl: {
          method: 'cname',
          type: 'dv'
        }
      });

      const customHostnameId = response.data.result.id;

      // Wait for DNS propagation (45 seconds in production, 0ms in tests)
      const sleepTime = process.env.NODE_ENV === 'test' ? 0 : 45000;
      await this.sleep(sleepTime);

      return customHostnameId;
    } catch (error) {
      console.error(`Failed to register custom hostname ${domain}:`, error);
      throw error;
    }
  }

  async createWorkerRoute(zoneId: string, domain: string): Promise<string> {
    // Step 3: Create Worker Route
    try {
      const response = await this.axiosInstance.post(
        `/zones/${zoneId}/workers/routes`,
        {
          pattern: `${domain}/*`,
          script: this.workerScript
        }
      );

      return response.data.result.id;
    } catch (error) {
      console.error(`Failed to create worker route for ${domain}:`, error);
      throw error;
    }
  }

  async addDomain(campaignId: string, domain: string) {
    // Complete 3-step process
    const zoneId = await this.detectZone(domain);
    const customHostnameId = await this.registerCustomHostname(zoneId, domain);
    const workerRoute = await this.createWorkerRoute(zoneId, domain);

    // Save to database
    const domainRecord = await this.prisma.campaignDomain.create({
      data: {
        campaignId,
        domain,
        zoneId,
        customHostnameId,
        status: 'ACTIVE'
      }
    });

    return {
      hostname: domainRecord.domain,
      zoneId: domainRecord.zoneId,
      customHostnameId: domainRecord.customHostnameId,
      workerRoute,
      status: 'ACTIVE'
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
