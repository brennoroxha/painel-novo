# Painel de Campanhas V2

Modern campaign management panel with real-time IP reputation analysis, domain integration, and multi-user authentication.

## Tech Stack

### Backend
- **Node.js 20+** with Express framework
- **PostgreSQL 15+** for data persistence
- **Prisma ORM** for type-safe database operations
- **Socket.io** for real-time WebSocket updates
- **JWT** for multi-user authentication
- **HMAC-SHA256** for FASE3 API security

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **TailwindCSS** with dark theme
- **Recharts** for data visualization
- **Socket.io-client** for real-time updates

### Deployment
- **Docker Compose** for local development and production
- **GitHub Actions** for CI/CD pipeline
- **Easypanel** for VPS management

## Features

- ✅ Multi-user authentication with role-based access (ADMIN, OPERATOR, VIEWER)
- ✅ Campaign CRUD operations with domain management
- ✅ IP reputation analysis via FASE3 API with 5 concurrent limit
- ✅ Cloudflare domain integration (3-step process)
- ✅ Real-time dashboard with WebSocket updates
- ✅ Complete audit logging
- ✅ Dark theme with responsive design
- ✅ Type-safe TypeScript throughout

## Project Structure

```
painel-campanhas-v2/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # API endpoint handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities (JWT, HMAC, etc.)
│   │   ├── websocket/      # Socket.io handlers
│   │   ├── types/          # TypeScript types
│   │   └── server.ts       # Express app entry
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── tests/              # Unit tests
│   └── Dockerfile
├── frontend/                # React/Vite app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API clients
│   │   ├── contexts/       # React contexts
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app
│   └── Dockerfile
├── docker-compose.yml       # Docker orchestration
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
└── docs/                   # Documentation
```

## Prerequisites

- Node.js 20+ or Docker/Docker Compose
- PostgreSQL 15+ (if not using Docker)
- npm or yarn

## Quick Start

### Local Development (without Docker)

1. **Clone repository**
   ```bash
   git clone https://github.com/brennoroxha/painel-novo.git
   cd painel-novo
   ```

2. **Setup environment files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Install dependencies**
   ```bash
   npm install
   npm install --workspaces
   ```

4. **Start PostgreSQL** (ensure it's running on localhost:5432)

5. **Setup database**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

6. **Run development servers**
   ```bash
   npm run dev
   ```

   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173

### Docker Development

1. **Build and start containers**
   ```bash
   docker-compose up --build
   ```

2. **Access application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - Database: PostgreSQL on port 5432

3. **Stop containers**
   ```bash
   docker-compose down
   ```

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API authentication token
- `CLOUDFLARE_ZONE_ID_FILTRAPRO` - Zone ID for domain management
- `FASE3_API_KEY` - FASE3 service authentication key
- `FASE3_SERVER` - FASE3 server IP (177.153.69.138)
- `FASE3_PORT` - FASE3 service port (3001)
- `NODE_ENV` - development, staging, or production
- `PORT` - Server port (default 3001)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default http://localhost:3001)
- `VITE_WS_URL` - WebSocket URL (default ws://localhost:3001)

## Database Schema

The system uses 8 main tables:

- **users** - User accounts with roles (ADMIN, OPERATOR, VIEWER)
- **campaigns** - Campaign records with metadata
- **campaign_domains** - Domains associated with campaigns
- **campaign_stats** - Campaign statistics and metrics
- **fase3_logs** - FASE3 API analysis logs
- **campaign_links** - Campaign tracking links
- **audit_logs** - Complete audit trail

See `backend/prisma/schema.prisma` for full schema details.

## API Documentation

### Authentication
- `POST /auth/register` - Create new user
- `POST /auth/login` - User login (returns JWT tokens)
- `POST /auth/refresh` - Refresh access token

### Campaigns
- `GET /campaigns` - List all campaigns
- `POST /campaigns` - Create campaign
- `GET /campaigns/:id` - Get campaign details
- `PUT /campaigns/:id` - Update campaign
- `DELETE /campaigns/:id` - Delete campaign

### Domain Management
- `GET /domains` - List domains
- `POST /domains/add` - Add domain to campaign (Cloudflare integration)
- `DELETE /domains/:id` - Remove domain

### IP Analysis (FASE3)
- `POST /fase3/analyze` - Analyze single IP
- `POST /fase3/analyze-batch` - Analyze multiple IPs
- `GET /fase3/logs` - View analysis history

### Real-Time
- WebSocket event: `campaign:update` - Campaign data changes
- WebSocket event: `ip:analyzed` - IP analysis results
- WebSocket event: `domain:added` - Domain added

## Testing

Run the test suite:

```bash
npm run test                    # Run all tests
npm run test --workspaces      # Run tests for all workspaces
cd backend && npm test          # Run backend tests only
```

## Deployment

### Easypanel Deployment

1. Push code to GitHub
2. Connect GitHub repository to Easypanel
3. Configure environment variables in Easypanel dashboard
4. Deploy using GitHub Actions workflow
5. Application available at your custom domain

### Manual VPS Deployment

```bash
# Pull latest code
git pull origin main

# Build and start with Docker Compose
docker-compose up --build -d

# View logs
docker-compose logs -f
```

## Architecture Decisions

### JWT Authentication
- Access tokens: 1 hour expiry (short-lived for security)
- Refresh tokens: 24 hours expiry (longer-lived for convenience)
- Stored in secure HTTP-only cookies (frontend implementation)

### FASE3 Integration
- HMAC-SHA256 signatures for request authentication
- 5 concurrent IP analysis limit to prevent overload
- Automatic retry with exponential backoff
- Request queuing for burst traffic

### Cloudflare Integration
- 3-step domain addition process:
  1. Create zone in Cloudflare (if not exists)
  2. Point nameservers to Cloudflare
  3. Verify domain ownership
- Rate limiting: 40 requests per 10 seconds

### Real-Time Updates
- Socket.io namespaces per campaign
- Automatic reconnection on disconnect
- Graceful degradation if WebSocket unavailable

## Performance

- Database connection pooling (default 10 connections)
- Optimized Prisma queries with selective field loading
- Frontend bundle optimization with Vite
- TailwindCSS purging for minimal CSS
- Image optimization via Recharts

## Security

- All API responses include CORS headers
- Request validation with Joi schemas
- Password hashing with bcrypt (10 rounds)
- Rate limiting on authentication endpoints
- SQL injection protection via Prisma ORM
- XSS protection via React's built-in escaping
- CSRF tokens for state-changing operations

## Troubleshooting

### Database connection errors
```bash
# Check PostgreSQL is running
psql -U painel_user -d painel_campanhas

# Reset migrations
cd backend && npx prisma migrate reset
```

### WebSocket connection issues
- Ensure backend is running on correct port
- Check firewall rules allow WebSocket connections
- Verify `VITE_WS_URL` environment variable

### FASE3 API errors
- Verify `FASE3_SERVER` and `FASE3_PORT` are correct
- Check network connectivity to 177.153.69.138:3001
- Validate `FASE3_API_KEY` in environment variables

## Contributing

1. Create feature branch
2. Follow TypeScript strict mode
3. Write tests for new features
4. Submit pull request with description

## License

Proprietary - Internal Use Only

## Support

For issues and questions, contact the development team.
