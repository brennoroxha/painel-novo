# Build stage
FROM node:20-slim AS build
WORKDIR /app

# Copy entire project
COPY . .

# Install all dependencies
RUN npm install --workspaces

# Build backend only
RUN npm run build --workspace=backend

# Runtime stage
FROM node:20-slim
WORKDIR /app/backend

# Install libssl1.1 for Prisma query engine
RUN apt-get update && apt-get install -y libssl1.1 openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and dist from build
COPY backend/package*.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/server.js"]
