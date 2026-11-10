-- ============================================================================
-- ClipLane Database Schema Migration: 20261110000000_init_schema.sql
-- Implements all tables, constraints, indexes, RLS policies, and the atomic claim function.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    priority_credits INT NOT NULL DEFAULT 0,
    banned_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 2. Jobs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'url')),
    source_path TEXT DEFAULT NULL,
    source_url TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'queued', 'processing', 'complete', 'failed', 'canceled', 'rejected')),
    lane TEXT NOT NULL DEFAULT 'free' CHECK (lane IN ('free', 'priority')),
    attempts INTEGER NOT NULL DEFAULT 0,
    error_code TEXT DEFAULT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NULL,
    started_at TIMESTAMPTZ DEFAULT NULL,
    finished_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 3. Clips Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time NUMERIC(8, 2) NOT NULL,
    end_time NUMERIC(8, 2) NOT NULL,
    duration NUMERIC(8, 2) NOT NULL,
    score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 4. Payments Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'mock',
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'canceled')),
    checkout_request_id TEXT UNIQUE DEFAULT NULL,
    mpesa_receipt TEXT UNIQUE DEFAULT NULL,
    provider_tx_id TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 5. Tutorial Progress Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tutorial_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tutorial_slug TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_tutorial UNIQUE (user_id, tutorial_slug)
);

-- ----------------------------------------------------------------------------
-- 6. Takedown Requests Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takedown_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_name TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    clip_id UUID REFERENCES public.clips(id) ON DELETE SET NULL,
    content_url TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'rejected')),
    ip_address TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 7. Audit Log Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT DEFAULT NULL,
    payload JSONB DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- INDEXES
-- Targeted FK indexing and hot query path acceleration
-- ============================================================================
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_user_created_idx ON public.jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_claim_queue_idx ON public.jobs(lane, created_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS clips_job_id_idx ON public.clips(job_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_job_id_idx ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS tutorial_progress_user_id_idx ON public.tutorial_progress(user_id);
CREATE INDEX IF NOT EXISTS takedown_requests_clip_id_idx ON public.takedown_requests(clip_id);
CREATE INDEX IF NOT EXISTS takedown_requests_created_idx ON public.takedown_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_id_idx ON public.audit_log(actor_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takedown_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND banned_at IS NULL
  );
$$;

-- PROFILES Policies
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile name/email"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = 'user' AND banned_at IS NULL);

-- Automatically create profile on auth.user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- JOBS Policies
CREATE POLICY "Users can select own jobs"
    ON public.jobs FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own jobs with free lane"
    ON public.jobs FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND lane = 'free'
      AND status IN ('uploaded', 'queued')
      AND attempts = 0
    );

-- CLIPS Policies
CREATE POLICY "Users can select clips of own jobs"
    ON public.clips FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = clips.job_id
        AND jobs.user_id = auth.uid()
      ) OR public.is_admin()
    );

-- PAYMENTS Policies
CREATE POLICY "Users can select own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- TUTORIAL PROGRESS Policies
CREATE POLICY "Users can select own tutorial progress"
    ON public.tutorial_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutorial progress"
    ON public.tutorial_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tutorial progress"
    ON public.tutorial_progress FOR DELETE
    USING (auth.uid() = user_id);

-- TAKEDOWN REQUESTS Policies
CREATE POLICY "Anyone can insert takedown requests"
    ON public.takedown_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view takedown requests"
    ON public.takedown_requests FOR SELECT
    USING (public.is_admin());

-- AUDIT LOG Policies
CREATE POLICY "Admins can view audit log"
    ON public.audit_log FOR SELECT
    USING (public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS & POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('uploads', 'uploads', false, 209715200, ARRAY['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm']),
  ('clips', 'clips', false, 104857600, ARRAY['video/mp4', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Uploads bucket policies (user folder prefix = auth.uid())
CREATE POLICY "Users can upload to own folder in uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'uploads'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read own uploads"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'uploads'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own uploads"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'uploads'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Clips bucket policies
CREATE POLICY "Users can read own clips from clips bucket"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'clips'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================================
-- ATOMIC CLAIM FUNCTION (SQL)
-- Uses FOR UPDATE SKIP LOCKED
-- Priority lane first, then free lane with min-wait and hourly throttle
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_next_job(
    p_worker_id TEXT DEFAULT 'worker-1',
    p_free_min_wait_hours INTEGER DEFAULT 24,
    p_free_max_per_hour INTEGER DEFAULT 10
)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_id UUID;
    v_recent_free_count INTEGER;
BEGIN
    -- 1. Try to claim a Priority job first (FIFO by created_at)
    SELECT id INTO v_job_id
    FROM public.jobs
    WHERE status = 'queued' AND lane = 'priority'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    -- 2. If no priority job, check the free lane conditions
    IF v_job_id IS NULL THEN
        -- Check how many free jobs have been claimed/started in the last 1 hour
        SELECT count(*) INTO v_recent_free_count
        FROM public.jobs
        WHERE lane = 'free'
          AND claimed_at >= (now() - interval '1 hour');

        -- Only claim free job if hourly cap is not exceeded
        IF v_recent_free_count < p_free_max_per_hour THEN
            SELECT id INTO v_job_id
            FROM public.jobs
            WHERE status = 'queued' 
              AND lane = 'free'
              AND created_at <= (now() - (p_free_min_wait_hours || ' hours')::interval)
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1;
        END IF;
    END IF;

    -- 3. If a job was locked, atomically update and return it
    IF v_job_id IS NOT NULL THEN
        RETURN QUERY
        UPDATE public.jobs
        SET status = 'processing',
            claimed_at = now(),
            started_at = now(),
            attempts = attempts + 1,
            updated_at = now()
        WHERE id = v_job_id
        RETURNING *;
    ELSE
        RETURN;
    END IF;
END;
$$;
