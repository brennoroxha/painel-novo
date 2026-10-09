# Painel Campanhas V2 — Backend

Production-ready Node.js/Express backend with JWT authentication, Cloudflare integration, and FASE3 IP reputation analysis.

## Quick Start

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp ../.env.example .env
   ```

   Required variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/painel_campanhas
   JWT_SECRET=your-secret-key-min-32-chars
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   CLOUDFLARE_ZONE_ID_FILTRAPRO=your-zone-id
   FASE3_API_KEY=your-fase3-api-key
   NODE_ENV=development
   PORT=3001
   ```

3. **Start PostgreSQL:**
   ```bash
   docker-compose up -d postgres
   ```

4. **Initialize database:**
   ```bash
   npm run migrate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:3001`

## API Endpoints

### Authentication

All protected routes require `Authorization: Bearer <jwt_token>` header.

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errors:**
- 400: Invalid email or password
- 404: User not found

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### POST /api/auth/logout
Invalidate current session. Protected.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me
Get current authenticated user. Protected.

**Response (200):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin"
}
```

### Campaigns

All campaign endpoints are protected.

#### GET /api/campaigns
List all campaigns for authenticated user.

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `take`: Number of records to return (default: 10)

**Response (200):**
```json
[
  {
    "id": "campaign-uuid",
    "name": "Campaign Name",
    "description": "Campaign description",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /api/campaigns/:id
Get campaign by ID.

**Response (200):**
```json
{
  "id": "campaign-uuid",
  "name": "Campaign Name",
  "description": "Campaign description",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 404: Campaign not found
- 403: Not authorized to access this campaign

#### POST /api/campaigns
Create new campaign.

**Request:**
```json
{
  "name": "New Campaign",
  "description": "Campaign description",
  "status": "active"
}
```

**Response (201):**
```json
{
  "id": "campaign-uuid",
  "name": "New Campaign",
  "description": "Campaign description",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### PATCH /api/campaigns/:id
Update campaign.

**Request:**
```json
{
  "name": "Updated Campaign",
  "status": "inactive"
}
```

**Response (200):**
```json
{
  "id": "campaign-uuid",
  "name": "Updated Campaign",
  "description": "Campaign description",
  "status": "inactive",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:31:00Z"
}
```

#### DELETE /api/campaigns/:id
Delete campaign.

**Response (204):** No content

### Domains

All domain endpoints are protected.

#### POST /api/domains/:campaignId
Add domain to campaign (3-step Cloudflare integration).

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response (201):**
```json
{
  "id": "domain-uuid",
  "campaignId": "campaign-uuid",
  "domain": "example.com",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Process:**
1. Detects Cloudflare zone for domain
2. Registers custom hostname on zone
3. Creates Worker route for domain
4. Waits for DNS propagation (configurable, 5s in test mode)

#### GET /api/domains/:campaignId
List domains for campaign.

**Response (200):**
```json
[
  {
    "id": "domain-uuid",
    "campaignId": "campaign-uuid",
    "domain": "example.com",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### DELETE /api/domains/:domainId
Remove domain from campaign.

**Response (204):** No content

### FASE3 IP Reputation

All FASE3 endpoints are protected.

#### POST /api/fase3/analyze
Analyze IP reputation.

**Request:**
```json
{
  "ip": "192.168.1.1"
}
```

**Response (200):**
```json
{
  "ip": "192.168.1.1",
  "verdict": "safe",
  "riskScore": 0.15,
  "componentScores": {
    "malware": 0.0,
    "phishing": 0.1,
    "spam": 0.2,
    "botnet": 0.0
  },
  "analyzedAt": "2024-01-15T10:30:00Z"
}
```

#### GET /api/fase3/logs
Get FASE3 analysis logs.

**Query Parameters:**
- `campaignId`: Filter by campaign (optional)
- `skip`: Number of records to skip (default: 0)
- `take`: Number of records to return (default: 20)

**Response (200):**
```json
[
  {
    "id": "log-uuid",
    "ip": "192.168.1.1",
    "verdict": "safe",
    "riskScore": 0.15,
    "componentScores": {
      "malware": 0.0,
      "phishing": 0.1,
      "spam": 0.2,
      "botnet": 0.0
    },
    "analyzedAt": "2024-01-15T10:30:00Z"
  }
]
```

### WebSocket Events

Connect to Socket.io server on `ws://localhost:3001` (same server as HTTP).

**Client → Server events:**
- `join-campaign`: Join campaign room for real-time updates
  ```javascript
  socket.emit('join-campaign', { campaignId: 'campaign-uuid' });
  ```

**Server → Client events:**
- `domain:added`: New domain added to campaign
  ```json
  {
    "campaignId": "campaign-uuid",
    "domain": "example.com",
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

- `fase3:verdict_received`: FASE3 analysis complete
  ```json
  {
    "campaignId": "campaign-uuid",
    "ip": "192.168.1.1",
    "verdict": "safe",
    "riskScore": 0.15,
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Generate Coverage Report
```bash
npm test -- --coverage
```

### Test Organization
- `src/auth.test.ts`: JWT token generation, verification, password hashing
- `src/middleware.test.ts`: Auth middleware, error handling
- `src/hmac.test.ts`: HMAC signature generation for FASE3
- `src/services/*.test.ts`: Service layer unit tests (Fase3Service, CloudflareService, CampaignService, etc.)

### Key Test Suites (42 passing tests)
- Authentication (8 tests): Login, token generation, refresh, password hashing
- Middleware (4 tests): Token validation, user context, error handling
- HMAC (4 tests): Signature generation, header creation
- FASE3 Service (4 tests): IP analysis, batch analysis, log storage
- Cloudflare Service (5 tests): Zone detection, custom hostname registration, Worker routes
- Campaign Routes (7 tests): CRUD operations, authorization
- Domain Routes (5 tests): Add/list/remove domains, Cloudflare integration
- FASE3 Routes (5 tests): Analysis, logs retrieval, auditing

## Deployment

### Docker

Build and run with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Backend server (port 3001)
- Frontend server (port 3000)

All services use environment variables from `.env.production`.

### Environment Variables for Production

```
DATABASE_URL=postgresql://painel_user:painel_password@postgres:5432/painel_campanhas
JWT_SECRET=<generate-strong-key-32+-chars>
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<your-api-token>
CLOUDFLARE_ZONE_ID_FILTRAPRO=<your-zone-id>
FASE3_API_KEY=<your-api-key>
NODE_ENV=production
PORT=3001
```

### GitHub Actions CI/CD

Automated testing and deployment:
- **On every push to main/develop:** Run full test suite against PostgreSQL
- **On push to main:** Deploy to VPS via SSH with `docker-compose up -d --build`

See `.github/workflows/test.yml` and `.github/workflows/deploy.yml` for details.

### Database Migrations

Before deploying:
```bash
npm run migrate
```

Prisma automatically applies pending migrations on application start if `NODE_ENV=production`.

## Architecture

### Layers
- **routes/**: Express route handlers (campaigns, domains, FASE3, auth)
- **services/**: Business logic (Fase3Service, CloudflareService, AuthService, CampaignService)
- **middleware/**: Express middleware (auth, error handling)
- **types/**: TypeScript interfaces for API contracts
- **prisma/**: Database schema and ORM

### Key Services
- **AuthService**: JWT generation, password hashing, token refresh
- **CloudflareService**: 3-step domain addition (zone detection → custom hostname → Worker route)
- **Fase3Service**: IP reputation analysis via HMAC-secured API calls
- **CampaignService**: Campaign CRUD operations
- **AuditService**: Action logging for compliance

### Database
PostgreSQL with Prisma ORM. 8 models: User, Campaign, Domain, Fase3Log, Audit.

## Performance

- **JWT-based stateless authentication**: No session storage
- **Connection pooling**: Prisma default pool (configured in DATABASE_URL)
- **Real-time updates**: Socket.io namespace per campaign (efficient room broadcasting)
- **API response times**: Avg 50-150ms (excluding external Cloudflare/FASE3 APIs)

## Security

- **Password hashing**: bcrypt with salt rounds 10
- **JWT tokens**: HS256, 15m access + 7d refresh
- **HMAC-SHA256**: Signed requests to FASE3 API
- **Auth middleware**: Token validation on all protected routes
- **CORS**: Configured for frontend domain
- **Environment variables**: Never committed to git (`.env` in `.gitignore`)

## Troubleshooting

### Database Connection Failed
```
error: connect ECONNREFUSED 127.0.0.1:5432
```
Ensure PostgreSQL is running: `docker-compose up -d postgres`

### JWT Token Expired
Frontend axios interceptor automatically refreshes using refresh token. If still fails, re-login.

### Cloudflare API Errors
Check `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ZONE_ID_FILTRAPRO` are correct.

### FASE3 Analysis Timeouts
FASE3 service waits up to 30s for analysis results. Check network connectivity and API key validity.

## Contributing

1. Create a test first (RED)
2. Implement minimal code to pass (GREEN)
3. Refactor if needed (REFACTOR)
4. Run full test suite: `npm test`
5. Commit with clear message

All commits include test output showing full suite passing.

## License

MIT
