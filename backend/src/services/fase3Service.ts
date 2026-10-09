import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { createFASE3Headers } from '../utils/hmac';

export interface FASE3Result {
  ip: string;
  verdict: 'ALLOW' | 'BLOCK' | 'CHALLENGE' | 'UNKNOWN';
  riskScore: number;
  componentScores: {
    proxycheck: number;
    bot_detection: number;
    behavioral: number;
    geolocation: number;
  };
  timestamp: string;
}

export class Fase3Service {
  private fase3Url = `http://${process.env.FASE3_SERVER}:${process.env.FASE3_PORT}`;
  private apiKey = process.env.FASE3_API_KEY!;

  constructor(private prisma: PrismaClient) {}

  async analyzeIP(ip: string): Promise<FASE3Result> {
    const payload = {
      _ip: ip,
      _ua: 'CampaignAnalytics/1.0',
      _ts: new Date().toISOString()
    };

    const headers = createFASE3Headers(payload, this.apiKey);

    try {
      const response = await axios.post(`${this.fase3Url}/api/check`, payload, {
        headers,
        timeout: 10000
      });

      return {
        ip,
        verdict: response.data.verdict || 'UNKNOWN',
        riskScore: response.data.risk_score || 0,
        componentScores: response.data.component_scores || {
          proxycheck: 0,
          bot_detection: 0,
          behavioral: 0,
          geolocation: 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`FASE3 analysis failed for IP ${ip}:`, error);
      return {
        ip,
        verdict: 'UNKNOWN',
        riskScore: 0,
        componentScores: {
          proxycheck: 0,
          bot_detection: 0,
          behavioral: 0,
          geolocation: 0
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeIPs(ips: string[], concurrency: number = 5): Promise<FASE3Result[]> {
    const results: FASE3Result[] = [];
    const uniqueIps = [...new Set(ips)];

    for (let i = 0; i < uniqueIps.length; i += concurrency) {
      const batch = uniqueIps.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(ip => this.analyzeIP(ip))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async saveFase3Log(campaignId: string, result: FASE3Result): Promise<void> {
    await this.prisma.fase3Log.create({
      data: {
        campaignId,
        ip: result.ip,
        verdict: result.verdict,
        riskScore: result.riskScore,
        componentScores: result.componentScores,
        analyzedAt: new Date(result.timestamp)
      }
    });
  }
}
