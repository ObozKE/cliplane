# ClipLane (`cliplane.tech`) — Production Deployment Runbook

Complete step-by-step guide to deploying ClipLane to production with a **100% $0 operating cost** using generous free tiers:
- **Web Frontend:** Vercel Hobby Tier ($0/mo)
- **Database, Auth & Storage:** Supabase Free Tier ($0/mo)
- **Rate Limiting:** Upstash Redis Free Tier ($0/mo) or In-Memory fallback
- **Worker (FFmpeg):** Render Free Docker Worker ($0/mo) or local/Docker background service
- **Custom Domain:** `cliplane.tech`

---

## 1. Supabase Project Setup ($0 Free Tier)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
   - `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` *(Never expose this to clients!)*
3. **Run Schema Migrations:**
   - In Supabase Dashboard → **SQL Editor**, paste the complete contents of `supabase/migrations/20261110000000_init_schema.sql` and click **Run**.
   - This provisions all tables (`profiles`, `jobs`, `clips`, `payments`, `tutorial_progress`, `takedown_requests`, `audit_log`), enables Row Level Security (RLS), configures targeted performance indexes, and establishes foreign key cascades.
4. **Create Private Storage Buckets:**
   - Navigate to **Storage → New Bucket**:
     - Name: `uploads` | Public: **OFF** (Private)
     - Name: `clips` | Public: **OFF** (Private)
   - The RLS policies in the migration automatically secure these buckets so users can only access their own `${userId}/...` path prefix via signed URLs.
5. **Enable Realtime:**
   - Navigate to **Database → Replication**.
   - Under `Source`, toggle **ON** replication for the `jobs` table so live queue and processing updates broadcast to the web dashboard.
6. **Authentication Settings:**
   - Navigate to **Authentication → URL Configuration**:
     - Site URL: `https://cliplane.tech`
     - Redirect URLs: `https://cliplane.tech/auth/callback`, `http://localhost:3000/auth/callback`

---

## 2. Upstash Redis Setup ($0 Free Tier)

1. Create a free Redis database at [upstash.com](https://upstash.com).
2. Under **REST API**, copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. *Note:* If you leave these blank, ClipLane automatically activates its built-in in-memory rate limiter fallback with zero configuration.

---

## 3. Vercel Web App Deployment ($0 Hobby Tier)

1. Import your GitHub repository into [vercel.com](https://vercel.com).
2. Set the framework preset to **Next.js**.
3. Set the Root Directory to `.` (the monorepo root) or rely on `vercel.json`.
4. Configure **Environment Variables** in Vercel:
   ```bash
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://cliplane.tech
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   UPSTASH_REDIS_REST_URL=https://<your-db>.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AX...
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   CRYPTO_WEBHOOK_SECRET=your_512_bit_secret_here
   ADMIN_EMAILS=admin@cliplane.tech,martinkiplangat45@gmail.com
   ALLOWED_ORIGINS=https://cliplane.tech,https://www.cliplane.tech
   ```
5. Add your custom domain `cliplane.tech` in **Project Settings → Domains**:
   - Add `A` record pointing `@` to `76.76.21.21`
   - Add `CNAME` record pointing `www` to `cname.vercel-dns.com`
6. Deploy! Vercel handles automated SSL/TLS provisioning.

---

## 4. Worker Service Deployment (FFmpeg Pipeline)

The background worker claims pending jobs from PostgreSQL and runs FFmpeg audio loudness (`ebur128`) and scene-change detection (`gt(scene,0.3)`).

### Option A: Render.com Free Docker Worker ($0)
1. Push your repository to GitHub.
2. In [render.com](https://render.com), click **New → Blueprint** and connect the repository.
3. Render automatically detects `render.yaml` and provisions `cliplane-worker` using `apps/worker/Dockerfile`.
4. Fill in the two sync environment variables: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Option B: Docker Container (Any host or local workstation)
```powershell
# Set environment variables in .env
docker compose up -d worker
```

### Option C: Native Node.js on Windows (Local Dev or Workstation)
```powershell
# Ensure Gyan.FFmpeg is installed
winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements

# Run worker daemon
pnpm --filter @cliplane/worker start
```

---

## 5. Payment Provider Webhooks Setup

### Stripe Webhook Configuration
1. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://cliplane.tech/api/webhooks/payments/stripe`
   - Events to listen for: `checkout.session.completed`
2. Copy the Signing Secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

### Crypto Webhook Configuration
- Endpoint: `https://cliplane.tech/api/webhooks/payments/crypto`
- Include the HTTP header `X-Crypto-Signature: <hmac-sha512(rawBody, CRYPTO_WEBHOOK_SECRET)>`

### M-Pesa (Daraja API) Webhook
- Endpoint: `https://cliplane.tech/api/webhooks/payments/mpesa`

---

## 6. Scheduled 3-Day Media Retention Cleanup

ClipLane enforces a strict **3-day retention policy** on all uploaded gameplay media and rendered vertical clips.

### Option A: Worker Scheduled Daemon
The worker service automatically runs the retention cleanup routine on a scheduled interval using `apps/worker/src/cleanup.ts`.

### Option B: Supabase `pg_cron` (Database level)
In Supabase SQL Editor:
```sql
SELECT cron.schedule(
    'purge-3-day-media',
    '0 3 * * *', -- Every day at 03:00 UTC
    $$
    DELETE FROM public.jobs
    WHERE created_at < NOW() - INTERVAL '3 days';
    $$
);
```

---

## 7. Pre-Deployment 9-Point Verification Checklist

| # | Check | Status | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **1** | **Strict Authorization (No IDOR)** | **PASS** | Every Server Action explicitly validates `user_id === user.id` in SQL queries. Verified in `jobs.test.ts`, `checkout.test.ts`, and `admin.test.ts`. |
| **2** | **Secure Tokens** | **PASS** | Supabase Storage signed URLs issued with short 1-hour TTLs for web playback and 5-minute single-use TTLs for downloads. |
| **3** | **Hostile Input Validation** | **PASS** | All inputs validated with strict Zod schemas (`uploadGateSchema`, `initiatePaymentSchema`, `takedownRequestSchema`). SSRF IP resolver rejects loopback, RFC 1918, and metadata IPs. |
| **4** | **Locked-Down CORS & Headers** | **PASS** | `next.config.ts` and `vercel.json` enforce HSTS, strict origin-when-cross-origin, DENY framing, and server actions origin allowlists. |
| **5** | **Rate Limiting** | **PASS** | Upstash Redis sliding window guards auth (5/min), job creation (10/hr), checkout (5/min), and DMCA takedowns (3/hr) with fallback. |
| **6** | **Custom Error Handling** | **PASS** | Unified `AppError` class with safe user-facing error codes (`SSRF_URL_REJECTED`, `INVALID_VIDEO_FORMAT`); Next.js `error.tsx` prevents stack leakage. |
| **7** | **Targeted DB Indexing** | **PASS** | Foreign keys (`user_id`, `job_id`, `actor_id`) and hot query columns (`lane, status, created_at`) fully indexed in migration `20261110000000_init_schema.sql`. |
| **8** | **Structured Logging** | **PASS** | `pino` logger formats JSON output with `service`, `env`, and structured `logBusinessEvent` audit trails. |
| **9** | **Deployment Readiness** | **PASS** | Stateless architecture ready for zero-downtime rolling deploys on Vercel and Docker/Render. |
