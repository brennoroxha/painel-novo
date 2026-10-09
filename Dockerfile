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
COPY backend/package*.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/.prisma ./.prisma
RUN npm install --production
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/server.js"]
