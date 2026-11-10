"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await requestPasswordReset(formData);
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
        <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          Check your email
        </h2>
        <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
          If an account exists for that address, we have dispatched a single-use password reset link with a 15-minute expiry window.
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
          Reset Password
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Enter your email to receive a secure, short-TTL reset link
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

        <button
          type="submit"
          disabled={isPending}
          className="button-primary w-full !py-2.5 text-sm !rounded-[4px] disabled:opacity-50"
        >
          {isPending ? "Sending reset link..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--line-paper)] text-center text-xs text-[var(--text-muted)]">
        Remember your password?{" "}
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
