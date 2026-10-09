# 🏗️ Painel Campanhas V2 - Design Specification

**Data:** 2026-10-09  
**Versão:** 1.0  
**Status:** Approved for Implementation  
**Author:** Claude + brennoroxha

---

## 📋 Visão Geral

Painel de campanhas V2 é um sistema completo para **gerenciar campanhas de filtro/bloqueio de IPs**, **analisar reputação de IPs via FASE3**, e **integrar domínios customizados na Cloudflare**. 

**Objetivo:** Substituir o painel antigo (SQLite) com uma arquitetura escalável (PostgreSQL), suporte multi-usuário, real-time updates, e dark theme minimalista.

**Escopo:** MVP completo com features essenciais + dashboard avançado + relatórios + suporte multi-usuário desde o início.

---

## 🎯 Requisitos Funcionais

### Core Features

1. **Autenticação & Usuários**
   - Login/logout com JWT (access token + refresh token)
   - Multi-usuário com 3 roles: ADMIN, OPERATOR, VIEWER
   - Admin: CRUD tudo + gerenciar usuários
   - Operator: CRUD campanhas + ver logs
   - Viewer: Apenas dashboard/logs (read-only)

2. **Campanhas CRUD**
   - Criar nova campanha (nome, descrição, status)
   - Editar campanha existente
   - Deletar campanha
   - Listar todas as campanhas (com paginação)
   - Ativar/desativar campanha

3. **Gerenciamento de Domínios**
   - Adicionar domínio customizado (padrão antigo: 3 steps)
     - Step 1: Detectar zona Cloudflare
     - Step 2: Registrar custom hostname
     - Step 3: Criar worker route
   - Remover domínio
   - Ver status de domínio (propagação DNS, etc)
   - Listar domínios por campanha

4. **Integração FASE3**
   - Análise de IP reputation em tempo real
   - Autenticação HMAC-SHA256
   - Endpoints: /api/check (análise), /api/logs (histórico), /health
   - Armazenar resultados em DB (encrypted_fingerprints)
   - Display: risk_score, verdict (ALLOW/BLOCK/CHALLENGE), component_scores

5. **Dashboard & Estatísticas**
   - KPIs em tempo real: campanhas ativas, IPs analisados, bloqueados, score médio
   - Gráficos: análises por hora/dia/semana
   - Tabela de IPs recentes (com filtros)
   - Distribuição de verdicts (ALLOW vs BLOCK vs CHALLENGE)
   - Mapa de países (geolocation)
   - Última análise vs histórico

6. **Logs & Audit Trail**
   - Log detalhado de análises FASE3
   - Audit trail de ações de usuários (create, update, delete)
   - Filtros por data, campanha, usuário, ação
   - Paginação com exportação CSV

7. **Real-Time Updates**
   - WebSocket para notificações instantâneas
   - Eventos: campaign:created, campaign:stats:updated, domain:added, fase3:verdict_received
   - Dashboard atualiza sem refresh

8. **URLs/Links**
   - Criar short codes para campanhas
   - Rastrear cliques por link
   - Distribuição de cliques por link

---

## 🗄️ Database Schema (PostgreSQL)

### Tabela: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: campaigns
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: campaign_domains
```sql
CREATE TABLE campaign_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  domain VARCHAR(255) NOT NULL UNIQUE,
  zone_id VARCHAR(255) NOT NULL,
  custom_hostname_id VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'FAILED')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: campaign_stats
```sql
CREATE TABLE campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  blocked_ips INTEGER DEFAULT 0,
  analyzed_ips INTEGER DEFAULT 0,
  avg_risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: fase3_logs
```sql
CREATE TABLE fase3_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  ip VARCHAR(45) NOT NULL,
  canvas_fingerprint VARCHAR(255),
  webgl_fingerprint VARCHAR(255),
  user_agent TEXT,
  device_type VARCHAR(50),
  country VARCHAR(100),
  is_headless BOOLEAN DEFAULT FALSE,
  verdict VARCHAR(50) NOT NULL CHECK (verdict IN ('ALLOW', 'BLOCK', 'CHALLENGE', 'UNKNOWN')),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  component_scores JSONB,
  blindagem_flags JSONB,
  encrypted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: campaign_links
```sql
CREATE TABLE campaign_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  short_code VARCHAR(10) UNIQUE NOT NULL,
  full_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 Frontend Architecture

### Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite (fast bundler)
- **Language:** TypeScript
- **Styling:** TailwindCSS + custom CSS
- **State Management:** React Context + hooks (simples, sem Redux)
- **HTTP Client:** axios + WebSocket
- **Charts:** Recharts (lightweight, dark mode friendly)
- **UI Components:** Radix UI primitives + custom components

### Directory Structure
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
│   │   │   └── LogFilters.tsx
│   │   └── Common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Table.tsx
│   │       └── Loader.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Campaigns.tsx
│   │   ├── Logs.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── useFasa3API.ts
│   ├── services/
│   │   ├── api.ts (axios instance)
│   │   ├── auth.ts
│   │   ├── campaigns.ts
│   │   └── fase3.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

### Design System

**Color Palette (Dark Theme Minimalista)**
```css
:root {
  --bg-primary: #0f0f14;     /* Page background */
  --bg-secondary: #1a1a22;   /* Card background */
  --bg-tertiary: #252532;    /* Hover states */
  --text-primary: #ffffff;   /* Main text */
  --text-secondary: #a0a0b0; /* Secondary text */
  --text-muted: #6a6a78;     /* Muted text */
  --border-color: #2a2a32;   /* Borders */
  --accent: #3b82f6;         /* Primary accent (blue) */
  --accent-hover: #2563eb;   /* Hover accent */
  --success: #10b981;        /* Success (green) */
  --warning: #f59e0b;        /* Warning (amber) */
  --danger: #ef4444;         /* Danger (red) */
}
```

**Typography**
- Font: Inter (system-ui fallback)
- Display: 32px bold
- Heading 1: 24px bold
- Heading 2: 20px semibold
- Body: 14px regular
- Caption: 12px regular
- Line-height: 1.5 (body), 1.3 (headings)

**Spacing**
- Grid: 8px base unit
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px

**Border Radius**
- Small: 4px
- Medium: 6px
- Large: 8px
- Full: 9999px (buttons, chips)

---

## 🔧 Backend Architecture

### Tech Stack
- **Framework:** Express.js
- **Language:** TypeScript
- **Database ORM:** Prisma (type-safe DB queries)
- **Authentication:** JWT (jsonwebtoken)
- **Real-Time:** Socket.io (WebSocket)
- **HTTP:** axios (para APIs externas)
- **Env:** dotenv

### Directory Structure
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
│   │   └── validator.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── campaigns.ts
│   │   ├── domains.ts
│   │   ├── fase3.ts
│   │   └── logs.ts
│   ├── utils/
│   │   ├── cloudflare.ts
│   │   ├── fase3.ts
│   │   └── jwt.ts
│   ├── websocket/
│   │   └── events.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── tsconfig.json
└── package.json
```

### API Endpoints

**Auth**
- `POST /api/auth/login` - Login (email + password)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

**Campaigns**
- `GET /api/campaigns` - List campaigns (paginated)
- `GET /api/campaigns/:id` - Get campaign detail
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

**Domains**
- `POST /api/campaigns/:id/domains` - Add domain (3-step process)
- `GET /api/campaigns/:id/domains` - List domains
- `DELETE /api/campaigns/:id/domains/:domainId` - Remove domain

**FASE3**
- `POST /api/campaigns/:id/analyze` - Analyze IPs (calls FASE3)
- `GET /api/campaigns/:id/fase3-logs` - Get FASE3 logs
- `GET /api/fase3-logs` - Global FASE3 logs

**Logs**
- `GET /api/logs/audit` - Audit logs
- `GET /api/logs/fase3` - FASE3 logs

**WebSocket Events**
- `campaign:created` - Broadcast when campaign created
- `campaign:stats:updated` - Real-time stats update
- `domain:added` - New domain added
- `fase3:verdict_received` - FASE3 analysis result

---

## 🔐 Autenticação & Segurança

### JWT Token Structure
```javascript
{
  userId: "uuid",
  email: "user@example.com",
  role: "ADMIN|OPERATOR|VIEWER",
  iat: 1234567890,
  exp: 1234571490 // 1 hora
}

// Refresh token:
{
  userId: "uuid",
  iat: 1234567890,
  exp: 1234654290 // 24 horas
}
```

### HMAC-SHA256 (FASE3 Integration)
```javascript
// Headers obrigatórios:
x-timestamp: milliseconds
x-signature: HMAC-SHA256(timestamp|payload, API_KEY)

// API Key: d24191ed291a92838f584dff4082c13f4f0d368614786f825bb7fcfcba8577e9
// Server: 177.153.69.138:3001
```

### Password Hashing
- Algorithm: bcrypt
- Rounds: 10
- Never store plain passwords

### CORS & CSRF
- CORS habilitado apenas para frontend domain
- CSRF token em cookies (SameSite=Strict)

---

## 🚀 Cloudflare Integration

### Padrão de Adicionar Domínio (3 Steps)

**Step 1: Detectar Zona**
```javascript
// Se domínio é subdomínio de filtrapro.app:
zoneId = ZONE_ID_FILTRAPRO_APP

// Se domínio independente:
zoneId = findZoneId(domain) // via Cloudflare API
```

**Step 2: Registrar Custom Hostname**
```javascript
POST /zones/{zoneId}/custom_hostnames
{
  hostname: domain,
  ssl: {
    method: "cname", // se same-account
    type: "dv"
  }
}
// Response: custom_hostname_id
```

**Step 3: Criar Worker Route**
```javascript
POST /zones/{zoneId}/workers/routes
{
  pattern: domain + "/*",
  script: "workerbn7cerebroprincipalnovo"
}
```

### Configuração
```javascript
CLOUDFLARE_ACCOUNT_ID = '15e3474e643a95410e55957b65b482d0'
CLOUDFLARE_API_TOKEN = '...'
CLOUDFLARE_ZONE_ID_FILTRAPRO = '...'
CLOUDFLARE_WORKER_SCRIPT = 'workerbn7cerebroprincipalnovo'
CNAME_TARGET = 'filtrapro.app'
```

---

## 🐳 Docker & Deployment

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: painel_campanhas
      POSTGRES_USER: painel_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://painel_user:${DB_PASSWORD}@postgres:5432/painel_campanhas
      JWT_SECRET: ${JWT_SECRET}
      CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN}
      FASE3_API_KEY: d24191ed291a92838f584dff4082c13f4f0d368614786f825bb7fcfcba8577e9
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://backend:3001

volumes:
  postgres_data:
```

### GitHub CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Easypanel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to VPS
        run: |
          ssh user@vps "cd /path/painel-campanhas && git pull && docker-compose up -d --build"
```

---

## 📊 Integração FASE3

### Fluxo de Análise
```
1. User clica "Analisar IPs" na campanha
   ↓
2. Backend coleta IPs do logs
   ↓
3. Para cada IP, chama FASE3 API:
   POST https://177.153.69.138:3001/api/check
   Headers: x-timestamp, x-signature (HMAC-SHA256)
   ↓
4. FASE3 retorna: verdict, risk_score, component_scores
   ↓
5. Salva em BD (fase3_logs)
   ↓
6. WebSocket broadcast "fase3:verdict_received"
   ↓
7. Dashboard atualiza em tempo real
```

### Response Structure
```javascript
{
  ip: "192.168.1.1",
  verdict: "ALLOW|BLOCK|CHALLENGE",
  risk_score: 45,
  component_scores: {
    proxycheck: 0,
    bot_detection: 20,
    behavioral: 15,
    geolocation: 10
  },
  timestamp: "2026-10-09T11:33:00Z"
}
```

---

## ✅ Definition of Done

1. ✅ Backend: APIs implementadas e testadas
2. ✅ Frontend: Componentes React + dark theme + responsivo
3. ✅ Database: Migrations Prisma rodadas
4. ✅ Autenticação: JWT + multi-user roles funcionando
5. ✅ Cloudflare Integration: 3-step domain addition funcional
6. ✅ FASE3 Integration: HMAC-SHA256 + análises funcionando
7. ✅ WebSocket: Real-time updates funcionando
8. ✅ Docker: docker-compose.yml testado
9. ✅ GitHub: Repository criado + CI/CD configurado
10. ✅ Documentação: README.md + API docs completos

---

## 🚨 Riscos & Mitigação

| Risco | Mitigação |
|-------|-----------|
| FASE3 API timeout | Retry logic com exponential backoff |
| Cloudflare API rate limit | Queue system com throttling |
| Database connection pool | Connection pooling via Prisma |
| JWT token expiration | Refresh token rotation |
| WebSocket memory leak | Proper disconnect handlers |

---

**Aprovado para Implementação:** brennoroxha ✅
