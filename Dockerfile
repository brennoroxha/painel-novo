# Build backend
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN npm install --workspaces
RUN npx prisma generate
RUN npm run build --workspace=backend

# Runtime backend
FROM node:20-slim
WORKDIR /app/backend

# Install libssl1.1 for Prisma query engine compatibility
RUN apt-get update && apt-get install -y libssl1.1 openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
RUN npm install --production
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/server.js"]
