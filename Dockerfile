# Build stage
FROM node:22-alpine3.21@sha256:e461a496f5ed8159268a6550adb8d3f182f009810a52b6a61701c3e90adba016 AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

RUN npm run build

# Production stage
FROM node:22-alpine3.21@sha256:e461a496f5ed8159268a6550adb8d3f182f009810a52b6a61701c3e90adba016 AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Start the application
CMD ["npm", "start"]
