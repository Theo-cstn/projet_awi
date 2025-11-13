FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Install build deps
RUN apk add --no-cache python3 make g++ 

# Copy package.json and lockfile and install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /usr/src/app

# Create non-root user for safety
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the necessary files from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Copy package.json (for meta)
COPY package*.json ./

# Copy certs volume
VOLUME ["/app/certs"]

# Use non-root
USER appuser

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/server.js"]