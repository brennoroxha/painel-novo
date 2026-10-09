export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Fase3Log {
  ip: string;
  verdict: 'ALLOW' | 'BLOCK' | 'CHALLENGE' | 'UNKNOWN';
  riskScore: number;
  componentScores: Record<string, number>;
  analyzedAt: string;
}
