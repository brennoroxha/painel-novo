FROM node:20-slim

WORKDIR /app

# Instalar dependências de sistema (incluindo OpenSSL)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copiar projeto inteiro
COPY . .

# Limpar node_modules local (pode causar problemas)
RUN rm -rf node_modules backend/node_modules frontend/node_modules

# Instalar dependências
RUN npm install --workspaces --legacy-peer-deps

# Gerar Prisma types
WORKDIR /app/backend
RUN npx prisma generate

# Build do backend
WORKDIR /app
RUN npm run build --workspace=backend

# Rodar
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/server.js"]
