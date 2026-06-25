# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools for native addons (like better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package config (package-lock.json is not required, npm will resolve)
COPY package.json ./

# Install all dependencies (production + devDependencies) using npm to ensure native addons compile correctly
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (places production assets in dist/)
RUN npm run build

# Stage 2: Runner stage
FROM node:20-slim AS runner

WORKDIR /app

# Copy production assets, server code, and node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose the application port
EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Persist database and downloaded images
VOLUME /app/data

# Start the application using tsx
CMD ["npx", "tsx", "server/index.ts"]
