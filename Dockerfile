# Build stage
FROM node:20-slim as builder

WORKDIR /app

# Install build dependencies including libssl1.1
RUN apt-get update && apt-get install -y libssl1.1 openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm ci --workspaces

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Generate Prisma types
WORKDIR /app/backend
RUN npx prisma generate
WORKDIR /app

# Build backend
RUN npm run build --workspace=backend

# Runtime stage
FROM node:20-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y libssl1.1 openssl && rm -rf /var/lib/apt/lists/*

# Copy package files for runtime
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install runtime dependencies only
RUN npm ci --workspaces --production=true --omit=dev

# Copy built application from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

# Set runtime directory
WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/auth/verify', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

EXPOSE 3001
CMD ["node", "dist/server.js"]
