"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail } from "@/app/auth/actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("redirect", redirectTarget);

    startTransition(async () => {
      const res = await signInWithEmail(formData);
      if (!res.success) {
        setError(res.error);
      } else {
        router.push(res.data.redirectUrl);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          Sign In to ClipName
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Manage your video jobs and download ready-to-post clips
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[4px] border border-[var(--status-alert)]/20 bg-red-50 p-3 text-xs text-[var(--status-alert)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="creator@example.com"
            className="w-full rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--accent-default)] focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-[var(--accent-default)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--accent-default)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="button-primary w-full !py-2.5 text-sm !rounded-[4px] disabled:opacity-50"
        >
          {isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--line-paper)] text-center text-xs text-[var(--text-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-[var(--accent-default)] font-medium hover:underline"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-xs text-[var(--text-muted)]">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
