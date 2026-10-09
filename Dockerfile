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

# Install all dependencies
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

# Install only runtime dependencies for Prisma
RUN apt-get update && apt-get install -y libssl1.1 && rm -rf /var/lib/apt/lists/*

# Copy production node_modules and built code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/package.json ./package.json

WORKDIR /app/backend

EXPOSE 3001
CMD ["node", "dist/server.js"]
