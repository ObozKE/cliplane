# ClipLane

Gameplay clip-generation web app producing 9:16 vertical clips with highlight scoring and transparent queues.

## Tech Stack
- **Web**: Next.js App Router (RSC by default), React 19, TypeScript (strict), Tailwind CSS v4, Radix UI Primitives, Framer Motion
- **Worker**: Node.js + FFmpeg in Docker
- **Data & Auth**: Supabase (PostgreSQL, Auth, Storage, Realtime), Drizzle ORM
- **Rate Limiting**: Upstash Redis (with zero-dependency in-memory fallback for local development)
- **Monorepo**: pnpm workspaces (`apps/web`, `apps/worker`, `packages/shared`)

---

## Local Development Setup

### 1. Requirements
- Node.js >= 20.x (tested on v26.5.0)
- pnpm >= 10.x
- Docker Desktop (for local Supabase and FFmpeg worker testing)

### 2. Install Dependencies
```powershell
pnpm install
```

### 3. Environment Variables
Copy `.env.example` to `apps/web/.env.local` and `apps/worker/.env`:
```powershell
Copy-Item .env.example apps/web/.env.local
Copy-Item .env.example apps/worker/.env
```

### 4. Running the Development Servers
```powershell
# Run all workspace apps concurrently
pnpm dev

# Or run specific apps
pnpm --filter @cliplane/web dev
pnpm --filter @cliplane/worker dev
```

---

## Verification & Testing Commands

```powershell
# Typecheck across all workspace packages
pnpm typecheck

# Lint all packages
pnpm lint

# Unit & integration tests
pnpm test

# End-to-end tests
pnpm test:e2e

# Production build
pnpm build
```

---

## Deployment & Rollback Strategy

### Deployment (Stateless Web on Vercel, Worker on Render / Fly.io / Docker)
1. **Migrations First**: Apply Supabase migrations:
   ```bash
   supabase db push
   ```
2. **Deploy Web App**: Deploy `apps/web` to Vercel with all production environment variables set.
3. **Deploy Worker Service**: Build and deploy worker container:
   ```bash
   docker build -f apps/worker/Dockerfile -t cliplane-worker:latest .
   ```
4. **Health Check Verification**:
   ```bash
   curl -f https://cliplane.tech/api/health
   ```

### Rollback Steps
1. **Web Rollback**: Instant rollback via Vercel Dashboard to the previous stable deployment hash (no downtime).
2. **Worker Rollback**: Redeploy the previous known-good Docker image tag on the worker host.
3. **Database Migration Rollback**: Apply the corresponding downward migration SQL or restore pre-deploy point-in-time backup if schema changes were breaking.
