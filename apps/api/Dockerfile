# syntax=docker/dockerfile:1
# ─── Stage 1: dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN npm install -g pnpm@9.15.4

WORKDIR /app

# Copy workspace manifests first (layer caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install only production + api deps (filter includes workspace deps)
RUN pnpm install --filter @socioply/api...

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build

RUN npm install -g pnpm@9.15.4

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Generate Prisma client then compile TypeScript
RUN pnpm --filter @socioply/api exec prisma generate && \
    pnpm --filter @socioply/api run build

# ─── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Article pipeline (Phase 8): Chromium + Mermaid CLI pre-installed so the
# image is ready when mmdc-based enrichment is activated.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser

RUN npm install -g pnpm@9.15.4 @mermaid-js/mermaid-cli

WORKDIR /app

# Copy compiled output and production node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/packages/db ./packages/db

# Non-root user for security
RUN addgroup -S socioply && adduser -S socioply -G socioply
USER socioply

EXPOSE 3001

# Default: start the API server. Override with "node dist/worker.js" for worker.
CMD ["node", "dist/index.js"]
