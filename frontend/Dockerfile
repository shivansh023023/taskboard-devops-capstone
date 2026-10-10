# ==========================================
# TaskBoard Frontend — Multi-Stage Dockerfile
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests for caching
COPY package.json package-lock.json ./

# Install exact dependencies reproducibly
RUN npm ci

# Copy frontend source code and configuration
COPY . .

# Build production static bundle (outputs to /app/dist)
RUN npm run build

# ------------------------------------------
# Stage 2: Runtime Stage (Minimal Nginx)
# ------------------------------------------
FROM nginx:alpine

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy and SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
