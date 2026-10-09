# Build backend
FROM node:20-slim AS build
WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN npm install
RUN npx prisma generate
RUN npm run build

# Runtime backend
FROM node:20-slim
WORKDIR /app/backend

# Install OpenSSL for Prisma compatibility
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
RUN npm install --production
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/server.js"]
