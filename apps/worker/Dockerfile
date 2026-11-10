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

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# -----------------------------------------------------------------------------
# Dependencies Stage
# -----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy root workspace configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

# Install workspace dependencies for shared and worker only
RUN pnpm install --frozen-lockfile --filter @cliplane/shared --filter @cliplane/worker

# -----------------------------------------------------------------------------
# Builder Stage
# -----------------------------------------------------------------------------
FROM deps AS builder
WORKDIR /app

COPY packages/shared/ ./packages/shared/
COPY apps/worker/ ./apps/worker/

# Build shared package
RUN pnpm --filter @cliplane/shared build

# -----------------------------------------------------------------------------
# Production Runner Stage
# -----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/worker ./apps/worker
COPY package.json pnpm-workspace.yaml ./

# Non-root user for security
RUN useradd -m -u 1001 workeruser && chown -R workeruser:workeruser /app
USER workeruser

# Start worker loop
CMD ["pnpm", "--filter", "@cliplane/worker", "start"]
