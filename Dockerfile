# Stage 1: Build (runs natively on the host, not under QEMU)
FROM --platform=$BUILDPLATFORM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production (multi-arch nginx, no Node.js needed)
FROM nginx:stable-alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Add custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
