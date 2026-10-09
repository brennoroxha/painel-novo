FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libssl1.1 && rm -rf /var/lib/apt/lists/*

# Copy everything
COPY . .

# Install dependencies with workspaces
RUN npm install --workspaces

# Generate Prisma client in backend workspace
WORKDIR /app/backend
RUN npx prisma generate
WORKDIR /app

# Build backend only
RUN npm run build --workspace=backend

# Start from backend directory
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/server.js"]
