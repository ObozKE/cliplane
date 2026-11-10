"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUpWithEmail } from "@/app/auth/actions";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await signUpWithEmail(formData);
      if (!res.success) {
        setError(res.error);
      } else {
        setIsSuccess(true);
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-[var(--status-success)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          Check your email
        </h2>
        <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
          We sent a verification link to your email address. Follow the link to activate your ClipLane account.
        </p>
        <div className="mt-6">
          <Link href="/auth/login" className="button-outline text-xs !py-2 !px-4">
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          Create Account
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Get started with free and Priority gameplay clipping
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
          <label
            htmlFor="password"
            className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
          >
            Password (min. 8 characters)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--accent-default)] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--accent-default)] focus:outline-none"
          />
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
            <input
              type="checkbox"
              required
              className="mt-0.5 rounded border-[var(--line-paper)] text-[var(--accent-default)] focus:ring-0"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-[var(--accent-default)] hover:underline">
                Terms of Service
              </Link>
              ,{" "}
              <Link href="/privacy" className="text-[var(--accent-default)] hover:underline">
                Privacy Policy
              </Link>
              , and confirm I will only submit gameplay footage I have the right to clip.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="button-primary w-full !py-2.5 text-sm !rounded-[4px] disabled:opacity-50"
        >
          {isPending ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--line-paper)] text-center text-xs text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-[var(--accent-default)] font-medium hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
