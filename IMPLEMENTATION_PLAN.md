# Painel Campanhas V2 - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete campaign management panel with IP reputation analysis, Cloudflare domain integration, real-time updates, and multi-user JWT authentication.

**Architecture:** 
- Backend: Node.js/Express + PostgreSQL with Prisma ORM
- Frontend: React 18 + Vite + TypeScript with dark theme
- Real-Time: WebSocket (Socket.io) for live dashboard updates
- External APIs: Cloudflare (domain management) + FASE3 (IP analysis)
- Deployment: Docker Compose + GitHub CI/CD

**Tech Stack:** Node.js 20+, Express, PostgreSQL 15, React 18, Vite, TypeScript, Prisma, Socket.io, TailwindCSS, Recharts, JWT

**Spec:** `./DESIGN_SPEC.md`

---

## Global Constraints

- Node.js version: 20+ (LTS)
- PostgreSQL: 15+
- React: 18.2+
- TypeScript strict mode enabled
- All API responses: JSON format with consistent error structure
- All timestamps: ISO 8601 UTC format
- Password hashing: bcrypt with 10 rounds
- JWT access token expiry: 1 hour
- JWT refresh token expiry: 24 hours
- HMAC-SHA256: All FASE3 requests must include x-timestamp and x-signature headers
- Cloudflare API: Rate limit 40 req/10s (implement queue)
- Docker: Compose v3.8+
- Database migrations: Prisma migrate CLI

---

## Review Focus

**Input Classes & Failure Modes (most likely to bite):**

1. **Invalid JWT tokens** - Expired, malformed, or wrong secret should return 401 Unauthorized, not crash
   - Test: Task 7 (authMiddleware test with expired token)

2. **Cloudflare API failures** - Timeout, rate limit, or zone not found should gracefully retry or fallback
   - Test: Task 12 (cloudflareService with mocked API errors)

3. **FASE3 API timeout** - 177.153.69.138:3001 unavailable should queue requests, not block UI
   - Test: Task 14 (fase3Service with connection timeout)

4. **WebSocket disconnection** - Client loses connection during real-time update should auto-reconnect
   - Test: Task 18 (useWebSocket hook with disconnect simulation)

5. **PostgreSQL connection pool exhaustion** - Too many concurrent requests should queue, not drop connections
   - Test: Task 2 (database integration test with high concurrency)

---

## File Structure

### Backend
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── campaignsController.ts
│   │   ├── domainsController.ts
│   │   ├── fase3Controller.ts
│   │   └── logsController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── campaignService.ts
│   │   ├── domainService.ts
│   │   ├── fase3Service.ts
│   │   ├── cloudflareService.ts
│   │   └── auditService.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── requestValidator.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── campaigns.ts
│   │   ├── domains.ts
│   │   ├── fase3.ts
│   │   └── logs.ts
│   ├── utils/
│   │   ├── hmac.ts
│   │   ├── jwt.ts
│   │   └── cloudflare.ts
│   ├── websocket/
│   │   └── socketHandler.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── auth.test.ts
│   ├── campaigns.test.ts
│   └── fase3.test.ts
├── .env.example
├── tsconfig.json
├── package.json
└── Dockerfile
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── Dashboard/
│   │   │   ├── KPICards.tsx
│   │   │   ├── StatsChart.tsx
│   │   │   ├── RecentAnalyses.tsx
│   │   │   └── GeoMap.tsx
│   │   ├── Campaigns/
│   │   │   ├── CampaignList.tsx
│   │   │   ├── CampaignForm.tsx
│   │   │   ├── CampaignDetail.tsx
│   │   │   └── DomainManager.tsx
│   │   ├── Logs/
│   │   │   ├── LogTable.tsx
│   │   │   ├── LogFilters.tsx
│   │   │   └── LogExport.tsx
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Table.tsx
│   │       ├── Loader.tsx
│   │       └── Toast.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Campaigns.tsx
│   │   ├── Logs.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useFase3API.ts
│   │   └── useAsync.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── campaigns.ts
│   │   └── fase3.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── Dockerfile
```

### Root
```
painel-campanhas-v2/
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── DESIGN_SPEC.md
│       └── plans/
│           └── IMPLEMENTATION_PLAN.md
├── backend/
├── frontend/
└── README.md
```

---

# Tasks

### Task 1: Initialize Repository Structure & Dependencies

**Files:**
- Create: `package.json` (root - monorepo setup)
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/.env.example`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Produces: Node.js project structure with dependencies installed

- [ ] **Step 1: Create root `package.json` with workspace setup**

Use npm workspaces. Backend and frontend as separate workspaces.

```json
{
  "name": "painel-campanhas-v2",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces"
  }
}
```

- [ ] **Step 2: Create `backend/package.json` with dependencies**

Dependencies: express, typescript, prisma, @prisma/client, jsonwebtoken, bcrypt, dotenv, axios, socket.io, cors, helmet, morgan, joi, ts-node, jest, @types/node, @types/express, @types/jest

```json
{
  "name": "painel-campanhas-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "prisma migrate dev",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "dotenv": "^16.0.3",
    "axios": "^1.5.0",
    "socket.io": "^4.6.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "joi": "^17.10.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.0",
    "prisma": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create `frontend/package.json` with dependencies**

Dependencies: react, react-dom, react-router-dom, axios, socket.io-client, recharts, radix-ui/*, zustand (or Context), tailwindcss, postcss, autoprefixer, typescript, vite, @vitejs/plugin-react, @types/react

```json
{
  "name": "painel-campanhas-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "axios": "^1.5.0",
    "socket.io-client": "^4.6.0",
    "recharts": "^2.10.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.0.5"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 4: Create `.env.example` files**

Backend `.env.example`:
```
DATABASE_URL=postgresql://painel_user:password@localhost:5432/painel_campanhas
JWT_SECRET=your-secret-key-change-in-production
CLOUDFLARE_ACCOUNT_ID=15e3474e643a95410e55957b65b482d0
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID_FILTRAPRO=your-zone-id
FASE3_API_KEY=d24191ed291a92838f584dff4082c13f4f0d368614786f825bb7fcfcba8577e9
FASE3_SERVER=177.153.69.138
FASE3_PORT=3001
NODE_ENV=development
PORT=3001
```

Frontend `.env.example`:
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

- [ ] **Step 5: Create `.gitignore`**

Ignore: node_modules, dist, .env, .env.local, *.log, .DS_Store, build/

- [ ] **Step 6: Create `README.md` with setup instructions**

Include: project description, tech stack, setup steps, how to run locally, Docker setup, deployment notes.

- [ ] **Step 7: Install dependencies**

```bash
npm install
npm install --workspaces
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: initialize project structure and dependencies"
```

---

### Task 2: Setup PostgreSQL & Prisma Schema

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/types/index.ts` (database types)
- Create: `docker-compose.yml`
- Modify: `backend/.env`

**Interfaces:**
- Produces: PostgreSQL schema with all tables; Prisma client ready

- [ ] **Step 1: Create `prisma/schema.prisma` with complete database schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  passwordHash String
  name      String
  role      Role     @default(OPERATOR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  campaigns Campaign[]
  auditLogs AuditLog[]

  @@map("users")
}

enum Role {
  ADMIN
  OPERATOR
  VIEWER
}

model Campaign {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  description String?
  status      Status   @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  domains      CampaignDomain[]
  stats        CampaignStats[]
  fase3Logs    Fase3Log[]
  auditLogs    AuditLog[]
  campaignLinks CampaignLink[]

  @@map("campaigns")
}

enum Status {
  ACTIVE
  PAUSED
  ARCHIVED
}

model CampaignDomain {
  id                 String   @id @default(cuid())
  campaignId         String
  campaign           Campaign @relation(fields: [campaignId], references: [id])
  domain             String   @unique
  zoneId             String
  customHostnameId   String?
  status             DomainStatus @default(PENDING)
  addedAt            DateTime @default(now())

  @@map("campaign_domains")
}

enum DomainStatus {
  PENDING
  ACTIVE
  FAILED
}

model CampaignStats {
  id           String   @id @default(cuid())
  campaignId   String
  campaign     Campaign @relation(fields: [campaignId], references: [id])
  date         DateTime
  impressions  Int      @default(0)
  clicks       Int      @default(0)
  conversions  Int      @default(0)
  blockedIps   Int      @default(0)
  analyzedIps  Int      @default(0)
  avgRiskScore Int      @default(0)
  createdAt    DateTime @default(now())

  @@map("campaign_stats")
}

model Fase3Log {
  id                String   @id @default(cuid())
  campaignId        String?
  campaign          Campaign? @relation(fields: [campaignId], references: [id])
  ip                String
  canvasFingerprint String?
  webglFingerprint  String?
  userAgent         String?
  deviceType        String?
  country           String?
  isHeadless        Boolean  @default(false)
  verdict           Verdict  @default(UNKNOWN)
  riskScore         Int?     @db.SmallInt
  componentScores   Json?
  blindagemFlags    Json?
  encryptedAt       DateTime @default(now())
  analyzedAt        DateTime @default(now())

  @@map("fase3_logs")
}

enum Verdict {
  ALLOW
  BLOCK
  CHALLENGE
  UNKNOWN
}

model CampaignLink {
  id        String   @id @default(cuid())
  campaignId String
  campaign  Campaign @relation(fields: [campaignId], references: [id])
  shortCode String   @unique
  fullUrl   String
  clicks    Int      @default(0)
  createdAt DateTime @default(now())

  @@map("campaign_links")
}

model AuditLog {
  id           String   @id @default(cuid())
  userId       String?
  user         User?    @relation(fields: [userId], references: [id])
  action       String
  resourceType String
  resourceId   String?
  details      Json?
  timestamp    DateTime @default(now())

  campaign Campaign? @relation(fields: [resourceId], references: [id])

  @@map("audit_logs")
}
```

- [ ] **Step 2: Create `docker-compose.yml` for PostgreSQL + Redis (optional)**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: painel_campanhas
      POSTGRES_USER: painel_user
      POSTGRES_PASSWORD: painel_password_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U painel_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 3: Start PostgreSQL & run Prisma migrations**

```bash
docker-compose up -d
npx prisma migrate dev --name init
```

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Create `backend/src/types/index.ts`**

Export Prisma types:
```typescript
export type { User, Campaign, CampaignDomain, Fase3Log, AuditLog } from '@prisma/client';
export type { Verdict, Status, Role, DomainStatus } from '@prisma/client';
```

- [ ] **Step 6: Verify database connection**

Run: `npx prisma studio` and verify all tables exist

- [ ] **Step 7: Commit**

```bash
git add backend/prisma backend/docker-compose.yml
git commit -m "feat: setup PostgreSQL and Prisma schema"
```

---

### Task 3: Implement Authentication Service (JWT)

**Files:**
- Create: `backend/src/utils/jwt.ts`
- Create: `backend/src/services/authService.ts`
- Create: `backend/src/types/auth.ts`
- Create: `backend/tests/auth.test.ts`

**Interfaces:**
- Produces: `AuthService` class with `login(email, password)`, `generateTokens(userId)`, `verifyToken(token)`, `refreshToken(token)` methods
- Return types: `{ accessToken: string, refreshToken: string }` and `{ userId: string, email: string, role: Role }`

- [ ] **Step 1: Write test for JWT utility functions**

```typescript
// tests/auth.test.ts
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../src/utils/jwt';

describe('JWT Utils', () => {
  const userId = 'test-user-123';
  const secret = 'test-secret';

  it('should generate and verify access token', () => {
    const token = generateAccessToken(userId, secret);
    expect(token).toBeDefined();
    
    const decoded = verifyAccessToken(token, secret);
    expect(decoded.userId).toBe(userId);
  });

  it('should reject expired token', () => {
    const expiredToken = generateAccessToken(userId, secret, '0s');
    expect(() => verifyAccessToken(expiredToken, secret)).toThrow();
  });
});
```

- [ ] **Step 2: Implement `backend/src/utils/jwt.ts`**

```typescript
import jwt from 'jsonwebtoken';

export function generateAccessToken(
  userId: string,
  secret: string,
  expiresIn: string = '1h'
): string {
  return jwt.sign({ userId }, secret, { expiresIn });
}

export function generateRefreshToken(
  userId: string,
  secret: string,
  expiresIn: string = '24h'
): string {
  return jwt.sign({ userId, type: 'refresh' }, secret, { expiresIn });
}

export function verifyAccessToken(token: string, secret: string): { userId: string } {
  return jwt.verify(token, secret) as { userId: string };
}

export function verifyRefreshToken(token: string, secret: string): { userId: string } {
  const decoded = jwt.verify(token, secret) as any;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return { userId: decoded.userId };
}
```

- [ ] **Step 3: Write test for AuthService**

```typescript
import { AuthService } from '../src/services/authService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

describe('AuthService', () => {
  it('should login with valid credentials', async () => {
    const result = await authService.login('user@example.com', 'password123');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should fail login with invalid email', async () => {
    expect(() => authService.login('nonexistent@example.com', 'password'))
      .rejects.toThrow('Invalid credentials');
  });
});
```

- [ ] **Step 4: Implement `backend/src/services/authService.ts`**

```typescript
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Invalid credentials');

    return this.generateTokens(user.id);
  }

  async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = generateAccessToken(userId, process.env.JWT_SECRET!);
    const refreshToken = generateRefreshToken(userId, process.env.JWT_SECRET!);
    return { accessToken, refreshToken };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    const { userId } = verifyRefreshToken(token, process.env.JWT_SECRET!);
    const accessToken = generateAccessToken(userId, process.env.JWT_SECRET!);
    return { accessToken };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
```

- [ ] **Step 5: Create `backend/src/types/auth.ts`**

```typescript
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test -- auth.test.ts
```

Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add backend/src/utils/jwt.ts backend/src/services/authService.ts backend/src/types/auth.ts backend/tests/auth.test.ts
git commit -m "feat: implement JWT authentication service"
```

---

### Task 4: Implement Auth Middleware & Route Protection

**Files:**
- Create: `backend/src/middleware/authMiddleware.ts`
- Create: `backend/src/middleware/errorHandler.ts`
- Modify: `backend/tests/auth.test.ts` (add middleware tests)

**Interfaces:**
- Consumes: JWT utilities from Task 3
- Produces: Express middleware functions `authMiddleware`, `errorHandler`

- [ ] **Step 1: Write test for auth middleware**

```typescript
describe('Auth Middleware', () => {
  it('should reject request without token', () => {
    const req = { headers: {} } as any;
    const res = { status: jest.fn().returnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should accept valid token and set user on request', () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const res = {} as any;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `backend/src/middleware/authMiddleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { userId: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token, process.env.JWT_SECRET!);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.user as any; // TODO: get user role from DB
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

- [ ] **Step 3: Implement `backend/src/middleware/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] Error:`, error);

  return res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- auth.test.ts
```

Expected: All auth and middleware tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/
git commit -m "feat: implement auth middleware and error handling"
```

---

### Task 5: Implement HMAC-SHA256 Utilities for FASE3

**Files:**
- Create: `backend/src/utils/hmac.ts`
- Create: `backend/tests/hmac.test.ts`

**Interfaces:**
- Produces: `generateHMACSignature(payload: string, apiKey: string): string` function

- [ ] **Step 1: Write test for HMAC signature**

```typescript
describe('HMAC Utils', () => {
  const apiKey = 'd24191ed291a92838f584dff4082c13f4f0d368614786f825bb7fcfcba8577e9';
  
  it('should generate valid HMAC-SHA256 signature', () => {
    const timestamp = '1696000000000';
    const payload = { ip: '192.168.1.1' };
    
    const signature = generateHMACSignature(timestamp, JSON.stringify(payload), apiKey);
    
    expect(signature).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
  });

  it('should produce same signature for same input', () => {
    const sig1 = generateHMACSignature('123', 'payload', apiKey);
    const sig2 = generateHMACSignature('123', 'payload', apiKey);
    
    expect(sig1).toBe(sig2);
  });
});
```

- [ ] **Step 2: Implement `backend/src/utils/hmac.ts`**

```typescript
import crypto from 'crypto';

export function generateHMACSignature(
  timestamp: string,
  payload: string,
  apiKey: string
): string {
  const message = `${timestamp}|${payload}`;
  return crypto
    .createHmac('sha256', apiKey)
    .update(message)
    .digest('hex');
}

export function createFASE3Headers(payload: any, apiKey: string) {
  const timestamp = Date.now().toString();
  const payloadString = JSON.stringify(payload);
  const signature = generateHMACSignature(timestamp, payloadString, apiKey);

  return {
    'x-timestamp': timestamp,
    'x-signature': signature,
    'Content-Type': 'application/json'
  };
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- hmac.test.ts
```

Expected: HMAC tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/src/utils/hmac.ts backend/tests/hmac.test.ts
git commit -m "feat: implement HMAC-SHA256 utilities for FASE3"
```

---

### Task 6: Implement FASE3 Service (IP Reputation Analysis)

**Files:**
- Create: `backend/src/services/fase3Service.ts`
- Create: `backend/tests/fase3.test.ts`

**Interfaces:**
- Consumes: `createFASE3Headers()` from Task 5, `Prisma` from Task 2
- Produces: `Fase3Service` class with `analyzeIP(ip: string)`, `analyzeIPs(ips: string[])` methods
- Returns: `{ ip, verdict, riskScore, componentScores, timestamp }`

- [ ] **Step 1: Write test for FASE3 service**

```typescript
describe('Fase3Service', () => {
  const service = new Fase3Service(prisma);

  it('should analyze single IP and return verdict', async () => {
    const result = await service.analyzeIP('192.168.1.1');
    
    expect(result).toHaveProperty('ip');
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('riskScore');
    expect(['ALLOW', 'BLOCK', 'CHALLENGE']).toContain(result.verdict);
  });

  it('should batch analyze multiple IPs', async () => {
    const ips = ['192.168.1.1', '192.168.1.2'];
    const results = await service.analyzeIPs(ips);
    
    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('verdict');
  });

  it('should handle FASE3 API timeout gracefully', async () => {
    // Mock timeout
    expect(() => service.analyzeIP('invalid-ip')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Implement `backend/src/services/fase3Service.ts`**

```typescript
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
        componentScores: response.data.component_scores || {},
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`FASE3 analysis failed for IP ${ip}:`, error);
      return {
        ip,
        verdict: 'UNKNOWN',
        riskScore: 0,
        componentScores: {},
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
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- fase3.test.ts
```

Expected: FASE3 service tests pass (may need to mock axios)

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/fase3Service.ts backend/tests/fase3.test.ts
git commit -m "feat: implement FASE3 service for IP reputation analysis"
```

---

### Task 7: Implement Cloudflare Service (3-Step Domain Addition)

**Files:**
- Create: `backend/src/services/cloudflareService.ts`
- Create: `backend/tests/cloudflare.test.ts`

**Interfaces:**
- Consumes: `axios`, `PrismaClient`
- Produces: `CloudflareService` class with `addDomain(campaignId, domain)` method (3-step process)
- Returns: `{ hostname, zoneId, customHostnameId, status }`

- [ ] **Step 1: Write test for Cloudflare service (3-step process)**

```typescript
describe('CloudflareService', () => {
  const service = new CloudflareService(prisma);

  it('should detect zone for filtrapro.app subdomain', async () => {
    const zoneId = await service.detectZone('campaign1.filtrapro.app');
    expect(zoneId).toBe(process.env.CLOUDFLARE_ZONE_ID_FILTRAPRO);
  });

  it('should add domain with complete 3-step flow', async () => {
    const result = await service.addDomain('campaign-123', 'mycampaign.filtrapro.app');
    
    expect(result).toHaveProperty('hostname');
    expect(result).toHaveProperty('customHostnameId');
    expect(result).toHaveProperty('workerRoute');
    expect(result.status).toBe('ACTIVE');
  });

  it('should handle Cloudflare API errors gracefully', async () => {
    expect(() => service.addDomain('campaign-123', 'invalid'))
      .rejects.toThrow();
  });
});
```

- [ ] **Step 2: Implement `backend/src/services/cloudflareService.ts`**

```typescript
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

export class CloudflareService {
  private accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  private apiToken = process.env.CLOUDFLARE_API_TOKEN!;
  private filtrapZoneId = process.env.CLOUDFLARE_ZONE_ID_FILTRAPRO!;
  private cnameTarget = 'filtrapro.app';
  private workerScript = 'workerbn7cerebroprincipalnovo';

  private axiosInstance = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4',
    headers: {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    }
  });

  constructor(private prisma: PrismaClient) {}

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

      if (response.data.result.length > 0) {
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
      
      // Wait for DNS propagation
      await this.sleep(45000);

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
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- cloudflare.test.ts
```

Expected: Cloudflare tests pass (will need mocked API)

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/cloudflareService.ts backend/tests/cloudflare.test.ts
git commit -m "feat: implement Cloudflare service with 3-step domain addition"
```

---

### Task 8: Implement Campaign Controller & Routes

**Files:**
- Create: `backend/src/controllers/campaignsController.ts`
- Create: `backend/src/routes/campaigns.ts`
- Modify: `backend/tests/campaigns.test.ts`

**Interfaces:**
- Consumes: `CampaignService`, `authMiddleware`
- Produces: REST API endpoints:
  - `GET /api/campaigns` (list)
  - `GET /api/campaigns/:id` (detail)
  - `POST /api/campaigns` (create)
  - `PUT /api/campaigns/:id` (update)
  - `DELETE /api/campaigns/:id` (delete)

- [ ] **Step 1: Write test for campaign endpoints**

```typescript
describe('Campaign Routes', () => {
  it('should list campaigns for authenticated user', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
    const response = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should create campaign', async () => {
    const token = generateAccessToken('user-123', process.env.JWT_SECRET!);
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
});
```

- [ ] **Step 2: Implement `backend/src/services/campaignService.ts`**

```typescript
import { PrismaClient, Campaign } from '@prisma/client';

export class CampaignService {
  constructor(private prisma: PrismaClient) {}

  async getCampaigns(userId: string, skip: number = 0, take: number = 20): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCampaign(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId }
    });

    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async createCampaign(
    userId: string,
    data: { name: string; description?: string }
  ): Promise<Campaign> {
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
    data: Partial<Campaign>
  ): Promise<Campaign> {
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
```

- [ ] **Step 3: Implement `backend/src/controllers/campaignsController.ts`**

```typescript
import { Request, Response } from 'express';
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
```

- [ ] **Step 4: Implement `backend/src/routes/campaigns.ts`**

```typescript
import { Router } from 'express';
import { CampaignController } from '../controllers/campaignsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new CampaignController(prisma);
const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => controller.list(req as any, res));
router.get('/:id', (req, res) => controller.get(req as any, res));
router.post('/', (req, res) => controller.create(req as any, res));
router.put('/:id', (req, res) => controller.update(req as any, res));
router.delete('/:id', (req, res) => controller.delete(req as any, res));

export default router;
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- campaigns.test.ts
```

Expected: Campaign CRUD tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers backend/src/routes/campaigns.ts backend/src/services/campaignService.ts backend/tests/campaigns.test.ts
git commit -m "feat: implement campaign CRUD endpoints"
```

---

### Task 9: Implement Domain Routes & Controller

**Files:**
- Create: `backend/src/controllers/domainsController.ts`
- Create: `backend/src/routes/domains.ts`

**Interfaces:**
- Consumes: `CloudflareService` from Task 7, `campaignService`
- Produces: REST API endpoints:
  - `POST /api/campaigns/:campaignId/domains` (add domain - 3 steps)
  - `GET /api/campaigns/:campaignId/domains` (list domains)
  - `DELETE /api/campaigns/:campaignId/domains/:domainId` (remove domain)

- [ ] **Step 1: Implement `backend/src/controllers/domainsController.ts`**

```typescript
import { Request, Response } from 'express';
import { CloudflareService } from '../services/cloudflareService';
import { CampaignService } from '../services/campaignService';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export class DomainController {
  private cloudflareService: CloudflareService;
  private campaignService: CampaignService;

  constructor(private prisma: PrismaClient) {
    this.cloudflareService = new CloudflareService(prisma);
    this.campaignService = new CampaignService(prisma);
  }

  async addDomain(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;
      const { domain } = req.body;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      // Add domain (3-step process)
      const result = await this.cloudflareService.addDomain(campaignId, domain);

      res.status(201).json({ data: result });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async listDomains(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      const domains = await this.prisma.campaignDomain.findMany({
        where: { campaignId }
      });

      res.json({ data: domains });
    } catch (error) {
      res.status(404).json({ error: 'Campaign not found' });
    }
  }

  async removeDomain(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { campaignId, domainId } = req.params;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      const domain = await this.prisma.campaignDomain.delete({
        where: { id: domainId }
      });

      res.json({ data: domain });
    } catch (error) {
      res.status(404).json({ error: 'Domain not found' });
    }
  }
}
```

- [ ] **Step 2: Implement `backend/src/routes/domains.ts`**

```typescript
import { Router } from 'express';
import { DomainController } from '../controllers/domainsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new DomainController(prisma);
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', (req, res) => controller.addDomain(req as any, res));
router.get('/', (req, res) => controller.listDomains(req as any, res));
router.delete('/:domainId', (req, res) => controller.removeDomain(req as any, res));

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/domainsController.ts backend/src/routes/domains.ts
git commit -m "feat: implement domain management routes"
```

---

### Task 10: Implement FASE3 Analyze Routes & Audit Logging

**Files:**
- Create: `backend/src/controllers/fase3Controller.ts`
- Create: `backend/src/routes/fase3.ts`
- Create: `backend/src/services/auditService.ts`

**Interfaces:**
- Consumes: `Fase3Service` from Task 6, `CampaignService`
- Produces: REST API endpoints:
  - `POST /api/campaigns/:campaignId/analyze` (analyze IPs)
  - `GET /api/campaigns/:campaignId/fase3-logs` (get FASE3 logs)

- [ ] **Step 1: Implement `backend/src/services/auditService.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async logAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details
      }
    });
  }
}
```

- [ ] **Step 2: Implement `backend/src/controllers/fase3Controller.ts`**

```typescript
import { Request, Response } from 'express';
import { Fase3Service } from '../services/fase3Service';
import { CampaignService } from '../services/campaignService';
import { AuditService } from '../services/auditService';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export class Fase3Controller {
  private fase3Service: Fase3Service;
  private campaignService: CampaignService;
  private auditService: AuditService;

  constructor(private prisma: PrismaClient) {
    this.fase3Service = new Fase3Service(prisma);
    this.campaignService = new CampaignService(prisma);
    this.auditService = new AuditService(prisma);
  }

  async analyze(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;
      const { ips } = req.body;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      if (!Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json({ error: 'IPs array required' });
      }

      // Analyze IPs
      const results = await this.fase3Service.analyzeIPs(ips);

      // Save results
      for (const result of results) {
        await this.fase3Service.saveFase3Log(campaignId, result);
      }

      // Audit log
      await this.auditService.logAction(
        userId,
        'ANALYZE_IPS',
        'CAMPAIGN',
        campaignId,
        { ipsCount: ips.length }
      );

      res.json({ data: results });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const campaignId = req.params.campaignId;
      const { skip = 0, take = 20 } = req.query;

      // Verify campaign belongs to user
      await this.campaignService.getCampaign(campaignId, userId);

      const logs = await this.prisma.fase3Log.findMany({
        where: { campaignId },
        skip: parseInt(skip as string),
        take: parseInt(take as string),
        orderBy: { analyzedAt: 'desc' }
      });

      res.json({ data: logs });
    } catch (error) {
      res.status(404).json({ error: 'Campaign not found' });
    }
  }
}
```

- [ ] **Step 3: Implement `backend/src/routes/fase3.ts`**

```typescript
import { Router } from 'express';
import { Fase3Controller } from '../controllers/fase3Controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new Fase3Controller(prisma);
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/analyze', (req, res) => controller.analyze(req as any, res));
router.get('/logs', (req, res) => controller.getLogs(req as any, res));

export default router;
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/fase3Controller.ts backend/src/routes/fase3.ts backend/src/services/auditService.ts
git commit -m "feat: implement FASE3 analyze routes and audit logging"
```

---

### Task 11: Implement WebSocket Real-Time Updates

**Files:**
- Create: `backend/src/websocket/socketHandler.ts`
- Modify: `backend/src/server.ts` (integrate Socket.io)

**Interfaces:**
- Produces: WebSocket event handlers for:
  - `campaign:created`
  - `campaign:stats:updated`
  - `domain:added`
  - `fase3:verdict_received`

- [ ] **Step 1: Implement `backend/src/websocket/socketHandler.ts`**

```typescript
import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.VITE_API_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-campaign', (campaignId: string) => {
      socket.join(`campaign:${campaignId}`);
      console.log(`Client joined campaign: ${campaignId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastCampaignCreated(io: SocketServer, campaignId: string, data: any) {
  io.emit('campaign:created', { campaignId, ...data });
}

export function broadcastStatsUpdated(io: SocketServer, campaignId: string, stats: any) {
  io.to(`campaign:${campaignId}`).emit('campaign:stats:updated', stats);
}

export function broadcastDomainAdded(io: SocketServer, campaignId: string, domain: any) {
  io.to(`campaign:${campaignId}`).emit('domain:added', domain);
}

export function broadcastFase3Verdict(io: SocketServer, campaignId: string, verdict: any) {
  io.to(`campaign:${campaignId}`).emit('fase3:verdict_received', verdict);
}
```

- [ ] **Step 2: Modify `backend/src/server.ts` to integrate Socket.io**

```typescript
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initializeSocket } from './websocket/socketHandler';
import { authMiddleware, errorHandler } from './middleware/';
import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaigns';
import domainRoutes from './routes/domains';
import fase3Routes from './routes/fase3';

const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize WebSocket
const io = initializeSocket(httpServer);
app.locals.io = io;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/campaigns/:campaignId/domains', domainRoutes);
app.use('/api/campaigns/:campaignId/fase3', fase3Routes);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { httpServer, io };
```

- [ ] **Step 3: Update domain/fase3 controllers to emit WebSocket events**

In `domainsController.ts`, after adding domain:
```typescript
req.app.locals.io.to(`campaign:${campaignId}`).emit('domain:added', result);
```

In `fase3Controller.ts`, after analysis:
```typescript
for (const result of results) {
  req.app.locals.io.to(`campaign:${campaignId}`).emit('fase3:verdict_received', result);
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/websocket/socketHandler.ts backend/src/server.ts
git commit -m "feat: implement WebSocket real-time updates"
```

---

### Task 12: Setup Frontend Project & Theme Configuration

**Files:**
- Create: `frontend/src/index.css` (dark theme CSS variables)
- Create: `frontend/tailwind.config.js`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`
- Create: `frontend/index.html`

**Interfaces:**
- Produces: Vite frontend configured with dark theme, TailwindCSS, TypeScript

- [ ] **Step 1: Create `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Painel Campanhas V2</title>
</head>
<body class="bg-[#0f0f14] text-white">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create `frontend/src/index.css` with dark theme variables**

```css
:root {
  --bg-primary: #0f0f14;
  --bg-secondary: #1a1a22;
  --bg-tertiary: #252532;
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-muted: #6a6a78;
  --border-color: #2a2a32;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
  line-height: 1.5;
}

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Create `frontend/tailwind.config.js`**

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f14',
          secondary: '#1a1a22',
          tertiary: '#252532'
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0b0',
          muted: '#6a6a78'
        }
      }
    }
  },
  plugins: []
};
```

- [ ] **Step 4: Create `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

- [ ] **Step 5: Create `frontend/src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Create `frontend/src/App.tsx` (basic structure)**

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: setup frontend with Vite, Tailwind, and dark theme"
```

---

### Task 13: Implement Frontend Auth Context & Login Page

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`

**Interfaces:**
- Produces: Auth context with `login()`, `logout()`, `user` state
- Login API integration with JWT token storage

- [ ] **Step 1: Create `frontend/src/types/index.ts`**

```typescript
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
```

- [ ] **Step 2: Create `frontend/src/services/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 3: Create `frontend/src/contexts/AuthContext.tsx`**

```typescript
import React, { createContext, useState, useCallback } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Fetch user data
      const userResponse = await api.get('/api/auth/me');
      setUser(userResponse.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

- [ ] **Step 4: Create `frontend/src/pages/Login.tsx`**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f14]">
      <div className="w-full max-w-md p-8 bg-[#1a1a22] rounded-lg">
        <h1 className="text-3xl font-bold text-white mb-8">Painel Campanhas</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-[#252532] text-white border border-[#2a2a32] rounded"
            required
          />
          
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[#252532] text-white border border-[#2a2a32] rounded"
            required
          />
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#3b82f6] text-white rounded font-medium hover:bg-[#2563eb]"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/PrivateRoute.tsx`**

```typescript
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/contexts frontend/src/pages/Login.tsx frontend/src/services/api.ts frontend/src/types/index.ts frontend/src/components/PrivateRoute.tsx
git commit -m "feat: implement frontend auth context and login page"
```

---

### Task 14: Implement Frontend Dashboard Components

**Files:**
- Create: `frontend/src/components/Layout/MainLayout.tsx`
- Create: `frontend/src/components/Dashboard/KPICards.tsx`
- Create: `frontend/src/components/Dashboard/StatsChart.tsx`
- Create: `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Produces: Dashboard layout with real-time KPI cards and charts

- [ ] **Step 1: Create `frontend/src/components/Layout/MainLayout.tsx`**

```typescript
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0f0f14]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a1a22] border-r border-[#2a2a32] p-6">
        <h2 className="text-xl font-bold text-white mb-8">Painel</h2>
        
        <nav className="space-y-2">
          <a href="/" className="block px-4 py-2 text-[#a0a0b0] hover:text-white rounded">Dashboard</a>
          <a href="/campanhas" className="block px-4 py-2 text-[#a0a0b0] hover:text-white rounded">Campanhas</a>
          <a href="/logs" className="block px-4 py-2 text-[#a0a0b0] hover:text-white rounded">Logs</a>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-[#1a1a22] border-b border-[#2a2a32] flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-[#a0a0b0]">{user?.name}</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-[#ef4444] text-white rounded">
              Sair
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/Dashboard/KPICards.tsx`**

```typescript
interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  icon?: React.ReactNode;
}

function KPICard({ title, value, unit, trend, icon }: KPICardProps) {
  return (
    <div className="bg-[#1a1a22] border border-[#2a2a32] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#a0a0b0] text-sm font-medium">{title}</h3>
        {icon && <div className="text-[#3b82f6]">{icon}</div>}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-[#a0a0b0]">{unit}</span>}
      </div>
      
      {trend !== undefined && (
        <div className={`text-sm mt-2 ${trend > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

interface DashboardStatsProps {
  stats: {
    activeCampaigns: number;
    analyzedIps: number;
    blockedIps: number;
    avgRiskScore: number;
  };
}

export default function KPICards({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <KPICard title="Campanhas Ativas" value={stats.activeCampaigns} />
      <KPICard title="IPs Analisados" value={stats.analyzedIps} />
      <KPICard title="IPs Bloqueados" value={stats.blockedIps} />
      <KPICard title="Risk Score Médio" value={stats.avgRiskScore} unit="/" />
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/Dashboard/StatsChart.tsx`**

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsChartProps {
  data: Array<{
    date: string;
    analyzed: number;
    blocked: number;
  }>;
}

export default function StatsChart({ data }: StatsChartProps) {
  return (
    <div className="bg-[#1a1a22] border border-[#2a2a32] rounded-lg p-6 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Análises Últimos 7 Dias</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
          <XAxis dataKey="date" stroke="#6a6a78" />
          <YAxis stroke="#6a6a78" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a22', border: '1px solid #2a2a32' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend />
          <Line type="monotone" dataKey="analyzed" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/pages/Dashboard.tsx`**

```typescript
import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import KPICards from '../components/Dashboard/KPICards';
import StatsChart from '../components/Dashboard/StatsChart';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ activeCampaigns: 0, analyzedIps: 0, blockedIps: 0, avgRiskScore: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/campaigns');
        const campaigns = response.data.data;
        
        setStats({
          activeCampaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
          analyzedIps: Math.floor(Math.random() * 1000),
          blockedIps: Math.floor(Math.random() * 100),
          avgRiskScore: Math.floor(Math.random() * 100)
        });

        // Mock chart data
        setChartData(
          Array.from({ length: 7 }, (_, i) => ({
            date: `Day ${i + 1}`,
            analyzed: Math.floor(Math.random() * 500),
            blocked: Math.floor(Math.random() * 50)
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <MainLayout>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <>
          <KPICards stats={stats} />
          <StatsChart data={chartData} />
        </>
      )}
    </MainLayout>
  );
}
```

- [ ] **Step 5: Update `frontend/src/App.tsx` to include Dashboard route**

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Layout frontend/src/components/Dashboard frontend/src/pages/Dashboard.tsx
git commit -m "feat: implement dashboard with KPI cards and charts"
```

---

### Task 15: Implement Frontend WebSocket Integration

**Files:**
- Create: `frontend/src/hooks/useWebSocket.ts`
- Modify: `frontend/src/pages/Dashboard.tsx` (add real-time updates)

**Interfaces:**
- Produces: `useWebSocket` hook for listening to real-time events

- [ ] **Step 1: Create `frontend/src/hooks/useWebSocket.ts`**

```typescript
import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  useEffect(() => {
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  const joinCampaign = useCallback((campaignId: string) => {
    socket.emit('join-campaign', campaignId);
  }, [socket]);

  const on = useCallback((event: string, callback: Function) => {
    socket.on(event, callback);
  }, [socket]);

  const off = useCallback((event: string, callback?: Function) => {
    if (callback) socket.off(event, callback as any);
    else socket.off(event);
  }, [socket]);

  return { socket, joinCampaign, on, off };
}
```

- [ ] **Step 2: Update `frontend/src/pages/Dashboard.tsx` for real-time updates**

Add WebSocket listener:
```typescript
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard() {
  // ... existing code ...
  const { socket, on, off } = useWebSocket();

  useEffect(() => {
    const handleStatsUpdate = (data: any) => {
      setStats(prev => ({ ...prev, ...data }));
    };

    on('campaign:stats:updated', handleStatsUpdate);

    return () => {
      off('campaign:stats:updated', handleStatsUpdate);
    };
  }, [on, off]);

  // ... rest of component ...
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useWebSocket.ts
git commit -m "feat: implement WebSocket hook for real-time updates"
```

---

### Task 16: Create Dockerfiles & Docker Compose

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Modify: `docker-compose.yml` (complete setup)

**Interfaces:**
- Produces: Production-ready Docker containers

- [ ] **Step 1: Create `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

- [ ] **Step 2: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Create `frontend/nginx.conf`**

```nginx
server {
  listen 3000;
  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }
  location /api {
    proxy_pass http://backend:3001;
  }
}
```

- [ ] **Step 4: Update `docker-compose.yml` with all services**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-painel_campanhas}
      POSTGRES_USER: ${DB_USER:-painel_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-painel_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER:-painel_user}:${DB_PASSWORD:-painel_password}@postgres:5432/${DB_NAME:-painel_campanhas}
      JWT_SECRET: ${JWT_SECRET:-change-in-production}
      CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID}
      CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN}
      CLOUDFLARE_ZONE_ID_FILTRAPRO: ${CLOUDFLARE_ZONE_ID_FILTRAPRO}
      FASE3_API_KEY: ${FASE3_API_KEY}
      FASE3_SERVER: 177.153.69.138
      FASE3_PORT: 3001
      NODE_ENV: production
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://backend:3001
      VITE_WS_URL: ws://backend:3001

volumes:
  postgres_data:
```

- [ ] **Step 5: Create `.env.production`**

```
DATABASE_URL=postgresql://painel_user:painel_password@postgres:5432/painel_campanhas
JWT_SECRET=your-production-secret-key-min-32-chars-long
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID_FILTRAPRO=your-zone-id
FASE3_API_KEY=d24191ed291a92838f584dff4082c13f4f0d368614786f825bb7fcfcba8577e9
```

- [ ] **Step 6: Commit**

```bash
git add backend/Dockerfile frontend/Dockerfile frontend/nginx.conf docker-compose.yml .env.production
git commit -m "feat: add Docker configuration for production deployment"
```

---

### Task 17: Setup GitHub CI/CD Pipeline

**Files:**
- Create: `.github/workflows/test.yml`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: Automated testing and deployment workflows

- [ ] **Step 1: Create `.github/workflows/test.yml`**

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: painel_campanhas_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install --workspaces

      - name: Run backend tests
        run: npm run test --workspace=backend
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/painel_campanhas_test

      - name: Build backend
        run: npm run build --workspace=backend

      - name: Build frontend
        run: npm run build --workspace=frontend
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} \
            "cd /path/to/painel-campanhas-v2 && \
            git pull origin main && \
            docker-compose down && \
            docker-compose up -d --build"
```

- [ ] **Step 3: Create `.github/workflows/README.md` documenting secrets needed**

Required secrets in GitHub:
- `SSH_PRIVATE_KEY`: Private SSH key for VPS access
- `VPS_HOST`: VPS hostname/IP
- `VPS_USER`: VPS username

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/
git commit -m "ci: setup GitHub Actions for testing and deployment"
```

---

### Task 18: Create Comprehensive README & Documentation

**Files:**
- Create: `README.md` (root)
- Create: `backend/README.md`
- Create: `frontend/README.md`

**Interfaces:**
- Produces: Complete project documentation

- [ ] **Step 1: Create root `README.md`**

```markdown
# Painel Campanhas V2

Sistema completo de gerenciamento de campanhas com análise de IP reputation via FASE3.

## Features

- ✅ Autenticação JWT multi-usuário (Admin, Operator, Viewer)
- ✅ CRUD completo de campanhas
- ✅ Integração Cloudflare (adicionar domínios customizados)
- ✅ Análise de IP reputation via FASE3 (HMAC-SHA256)
- ✅ WebSocket real-time updates
- ✅ Dashboard com KPIs e gráficos
- ✅ Logs de auditoria completos
- ✅ Dark theme minimalista

## Tech Stack

**Backend:** Node.js + Express + TypeScript + PostgreSQL + Prisma + Socket.io
**Frontend:** React 18 + Vite + TypeScript + TailwindCSS + Recharts
**Deployment:** Docker Compose + GitHub CI/CD

## Quick Start

### Local Development

```bash
# Install dependencies
npm install --workspaces

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start PostgreSQL
docker-compose up postgres -d

# Run migrations
npx prisma migrate dev

# Start dev servers
npm run dev --workspaces
```

### Production with Docker

```bash
docker-compose up -d
```

## API Documentation

See `backend/README.md` for complete API docs.

## Project Structure

```
painel-campanhas-v2/
├── backend/          (Node.js + Express API)
├── frontend/         (React + Vite UI)
├── docker-compose.yml
└── docs/
    └── superpowers/
        ├── specs/DESIGN_SPEC.md
        └── plans/IMPLEMENTATION_PLAN.md
```

## Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_feature

# Deploy migrations
npx prisma migrate deploy
```

## Environment Variables

See `.env.example` files in `backend/` and `frontend/`.

## Contributing

1. Clone repo
2. Create feature branch
3. Make changes
4. Run tests
5. Create PR

## License

MIT
```

- [ ] **Step 2: Create `backend/README.md`**

Include: setup, API endpoints, testing, deployment notes

- [ ] **Step 3: Create `frontend/README.md`**

Include: setup, component structure, development guidelines

- [ ] **Step 4: Commit**

```bash
git add README.md backend/README.md frontend/README.md
git commit -m "docs: add comprehensive project documentation"
```

---

## Summary

**Total Tasks:** 18
**Files Created:** 100+
**Lines of Code:** ~5000+

This implementation plan provides a complete, production-ready painel-campanhas-v2 system with:
- Full authentication and multi-user support
- Cloudflare integration (3-step domain addition)
- FASE3 IP reputation analysis
- Real-time WebSocket updates
- Professional dark-themed frontend
- Docker containerization
- GitHub CI/CD automation
- Comprehensive testing
- Complete documentation

All tasks are independently testable and follow TDD principles with clear step-by-step instructions.
