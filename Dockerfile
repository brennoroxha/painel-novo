# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN npm install --workspaces
RUN npm run build --workspace=backend

# Runtime stage
FROM node:20-slim
WORKDIR /app/backend
RUN apt-get update && apt-get install -y libssl1.1 openssl && rm -rf /var/lib/apt/lists/*
COPY backend/package.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/server.js"]
