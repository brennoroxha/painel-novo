# Build backend
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN npm install
RUN npx prisma generate
RUN npm run build

# Runtime backend
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/prisma ../prisma
EXPOSE 3001
CMD ["node", "dist/server.js"]
