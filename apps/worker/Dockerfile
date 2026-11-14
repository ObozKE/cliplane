# -----------------------------------------------------------------------------
# ClipLane Worker Service Dockerfile
# Production-ready container with Node.js 22 & FFmpeg
# -----------------------------------------------------------------------------

FROM node:22-bookworm-slim AS base
WORKDIR /app

# Install system dependencies: FFmpeg & CA certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Verify FFmpeg installation
RUN ffmpeg -version && ffprobe -version

# Enable pnpm for dependencies stage
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# -----------------------------------------------------------------------------
# Dependencies Stage
# -----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy root workspace configurations including base tsconfig
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

# Install workspace dependencies for shared and worker only
RUN pnpm install --frozen-lockfile --filter @cliplane/shared --filter @cliplane/worker

# -----------------------------------------------------------------------------
# Builder Stage
# -----------------------------------------------------------------------------
FROM deps AS builder
WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/worker/ ./apps/worker/

# -----------------------------------------------------------------------------
# Production Runner Stage
# -----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts, configs, and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/worker ./apps/worker
COPY tsconfig.base.json package.json pnpm-workspace.yaml ./

# Non-root user for security
RUN useradd -m -u 1001 workeruser
USER workeruser

EXPOSE 10000

# Start worker loop and health server via local tsx runner (no runtime downloads)
CMD ["node", "apps/worker/node_modules/tsx/dist/cli.mjs", "apps/worker/src/index.ts"]
