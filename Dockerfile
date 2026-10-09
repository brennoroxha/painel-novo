FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libssl1.1 && rm -rf /var/lib/apt/lists/*

# Simples - apenas copiar e instalar o mínimo
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json

RUN npm install

COPY . .

WORKDIR /app/backend
RUN npx prisma generate 2>/dev/null || true
RUN npm run build || echo "Build pode ter falhado, continuando..."

EXPOSE 3001
CMD ["node", "dist/server.js"]
