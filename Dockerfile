# Build stage
FROM node:20-slim AS build
WORKDIR /app

# Copy workspace root files
COPY package*.json ./

# Copy workspace configs
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Copy all source code
COPY backend ./backend
COPY frontend ./frontend

# Install all dependencies
RUN npm install --workspaces

# Build backend
RUN npm run build --workspace=backend

# Runtime stage
FROM node:20-slim
WORKDIR /app/backend

# Install libssl1.1 for Prisma query engine
RUN apt-get update && apt-get install -y libssl1.1 openssl && rm -rf /var/lib/apt/lists/*

# Copy backend package files
COPY backend/package*.json ./

# Copy compiled backend from build stage
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma

# Install runtime dependencies
RUN npm install --production

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001
CMD ["node", "dist/server.js"]
