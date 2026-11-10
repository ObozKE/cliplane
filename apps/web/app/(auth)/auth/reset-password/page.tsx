"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";

export default function ResetPasswordPage() {
  const router = useRouter();
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
      const res = await updatePassword(formData);
      if (!res.success) {
        setError(res.error);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          Password updated
        </h2>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Your password has been securely updated. Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          Set New Password
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Enter your new password below
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
            htmlFor="password"
            className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
          >
            New Password (min. 8 characters)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--accent-default)] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full rounded-[4px] border border-[var(--line-paper)] bg-[var(--bg-paper)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:border-[var(--accent-default)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="button-primary w-full !py-2.5 text-sm !rounded-[4px] disabled:opacity-50"
        >
          {isPending ? "Updating password..." : "Update Password"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--line-paper)] text-center text-xs text-[var(--text-muted)]">
        <Link href="/auth/login" className="text-[var(--accent-default)] hover:underline">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}
