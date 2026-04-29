# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY backend/ .

# Build NestJS
RUN npm run build

# Prisma client generation
RUN npx prisma generate

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and migrations
COPY backend/prisma ./prisma/

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Override node:18-alpine's ENTRYPOINT and run migrations then start app
ENTRYPOINT []
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
