# Multi-stage Dockerfile for FoodRescue Backend

# Stage 1: Build TypeScript source
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy configuration and source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory if local storage fallback is needed
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Expose default backend port
EXPOSE 5000

# Use non-root node user for security
USER node

# Start the application
CMD ["node", "dist/server.js"]
