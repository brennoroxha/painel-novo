FROM node:20-slim

WORKDIR /app

# Install libssl1.1 for Prisma
RUN apt-get update && apt-get install -y libssl1.1 openssl && rm -rf /var/lib/apt/lists/*

# Copy entire project
COPY . .

# Install all dependencies
RUN npm install --workspaces

# Generate Prisma types
RUN npx prisma generate

# Build backend
RUN npm run build --workspace=backend

# Prepare runtime
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/server.js"]
