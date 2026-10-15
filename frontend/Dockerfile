# ==========================================
# TaskBoard Frontend — Multi-Stage Dockerfile
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
FROM node:22-alpine AS builder

# Upgrade Alpine packages in builder stage
RUN apk update && apk upgrade --no-cache

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
# Stage 2: Runtime Stage (Minimal Nginx Non-Root)
# ------------------------------------------
FROM nginx:alpine

# Upgrade Alpine OS packages to apply distribution security patches
RUN apk update && apk upgrade --no-cache

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy and SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Configure Nginx for unprivileged non-root execution:
# 1. Update PID file location to /tmp/nginx.pid in main Nginx configuration
# 2. Remove root-only "user nginx;" directive from main config to prevent startup warnings
# 3. Ensure all runtime directories (webroot, cache, log, conf.d, tmp) are owned by user nginx (UID 101)
RUN sed -i -E 's|pid\s+/[^;]+;|pid /tmp/nginx.pid;|g' /etc/nginx/nginx.conf && \
    sed -i '/user  nginx;/d' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /tmp/nginx.pid && \
    chown nginx:nginx /tmp/nginx.pid

# Switch to unprivileged non-root user (UID 101)
USER nginx

# Expose unprivileged HTTP port 8080
EXPOSE 8080

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
