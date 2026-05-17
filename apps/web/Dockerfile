# ==========================================
# Stage 1: Build Stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_AZURE_CLIENT_ID=
ARG VITE_AZURE_TENANT_ID=
ARG VITE_AZURE_REDIRECT_URI=http://localhost:5173

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_AZURE_REDIRECT_URI=$VITE_AZURE_REDIRECT_URI

# Copy package files from all workspaces
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
COPY prisma ./prisma

# Install dependencies and generate Prisma client
RUN npm ci --prefer-offline --no-audit && \
    npx prisma@6 generate

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build with Vite
RUN cd apps/web && npm run build

# ==========================================
# Stage 2: Serve with Nginx
# ==========================================
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default Nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/apps/web/dist ./

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
