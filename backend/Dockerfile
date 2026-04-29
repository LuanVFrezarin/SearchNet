# Build stage
FROM node:18-slim AS builder

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend/ .
RUN npm run build && ls -la dist/
RUN npx prisma generate

# Production stage - usar Debian slim para compatibilidade com Prisma/OpenSSL
FROM node:18-slim

WORKDIR /app

# OpenSSL necessário para Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
RUN ls -la dist/ || echo "DIST VAZIO!"

RUN mkdir -p uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Override node:18-alpine's ENTRYPOINT and run migrations then start app
ENTRYPOINT []
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
