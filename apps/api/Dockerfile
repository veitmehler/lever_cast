# syntax=docker/dockerfile:1
# ─── Stage 1: install + build ─────────────────────────────────────────────────
FROM node:20-alpine AS build

RUN npm install -g pnpm@9.15.4

WORKDIR /app

# Copy workspace root files
COPY pnpm-workspace.yaml package.json ./
COPY .npmrc ./

# Copy package manifests for all workspace packages needed
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (pnpm hoists to root node_modules)
RUN pnpm install --no-frozen-lockfile

# Copy source files
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Generate Prisma client and build TypeScript
RUN cd apps/api && npx prisma generate && npx tsc

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Article pipeline (Phase 8): Chromium + Mermaid CLI pre-installed
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser

RUN npm install -g @mermaid-js/mermaid-cli

WORKDIR /app

# Copy compiled output and all node_modules from build stage
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/db ./packages/db

# Non-root user for security
RUN addgroup -S socioply && adduser -S socioply -G socioply
USER socioply

EXPOSE 3001

CMD ["node", "dist/index.js"]
