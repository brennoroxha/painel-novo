FROM node:20-slim

WORKDIR /app

# Install libssl1.1 for Prisma + other utilities
RUN apt-get update && apt-get install -y libssl1.1 openssl curl && rm -rf /var/lib/apt/lists/*

# Copy package files for dependencies (root and workspaces)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies
RUN npm install --workspaces --production=false

# Copy source code and schema files
COPY backend ./backend
COPY frontend ./frontend

# Generate Prisma types (from backend workspace)
RUN cd backend && npx prisma generate

# Build backend
RUN npm run build --workspace=backend

# Prepare runtime
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/server.js"]
