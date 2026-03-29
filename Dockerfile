# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Add custom Nginx config for SPA routing (optional but recommended)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
