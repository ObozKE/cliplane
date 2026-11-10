"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { errorResult, successResult, type ActionResult } from "@clipname/shared";

const authEmailSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password exceeds maximum allowable length"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password exceeds maximum allowable length"),
});

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return headerList.get("x-real-ip") || "127.0.0.1";
}

/**
 * Sign In with email and password
 */
export async function signInWithEmail(formData: FormData): Promise<ActionResult<{ redirectUrl: string }>> {
  const ip = await getClientIp();

  try {
    // 1. Rate Limiting (5 bad attempts / min / IP)
    await enforceRateLimit("auth", `login:${ip}`);

    // 2. Hostile Input Validation
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const parsed = authEmailSchema.safeParse(rawData);
    if (!parsed.success) {
      return errorResult(parsed.error.errors[0]?.message || "Invalid credentials format", "VALIDATION_FAILED");
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    // 3. Supabase Auth Sign In
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return errorResult("Invalid email or password.", "UNAUTHORIZED");
    }

    // 4. Check if account is suspended / banned
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, banned_at")
      .eq("id", data.user.id)
      .single();

    if (profile?.banned_at) {
      await supabase.auth.signOut();
      return errorResult("This account has been suspended.", "FORBIDDEN");
    }

    const redirectTo = (formData.get("redirect") as string) || "/dashboard";
    return successResult({ redirectUrl: redirectTo });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 429) {
      return errorResult("Too many login attempts. Please wait before trying again.", "RATE_LIMITED");
    }
    return errorResult("An unexpected error occurred during sign in. Please try again.", "INTERNAL_ERROR");
  }
}

/**
 * Sign Up with email and password
 */
export async function signUpWithEmail(formData: FormData): Promise<ActionResult<{ confirmationRequired: boolean }>> {
  const ip = await getClientIp();

  try {
    await enforceRateLimit("auth", `signup:${ip}`);

    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const parsed = authEmailSchema.safeParse(rawData);
    if (!parsed.success) {
      return errorResult(parsed.error.errors[0]?.message || "Invalid input data", "VALIDATION_FAILED");
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return errorResult(error.message, "BAD_REQUEST");
    }

    const requiresEmailConfirmation = !data.session;
    return successResult({ confirmationRequired: requiresEmailConfirmation });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 429) {
      return errorResult("Too many signup requests. Please wait a moment.", "RATE_LIMITED");
    }
    return errorResult("An error occurred while creating your account. Please try again.", "INTERNAL_ERROR");
  }
}

/**
 * Request Password Reset (short TTL magic link/OTP)
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult<{ sent: boolean }>> {
  const ip = await getClientIp();

  try {
    await enforceRateLimit("auth", `reset:${ip}`);

    const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
    if (!parsed.success) {
      return errorResult("Please provide a valid email address.", "VALIDATION_FAILED");
    }

    const supabase = await createClient();
    const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/reset-password`,
    });

    // Always return success to prevent email enumeration attacks
    return successResult({ sent: true });
  } catch {
    return errorResult("Too many password reset requests. Please wait before trying again.", "RATE_LIMITED");
  }
}

/**
 * Update Password (after following reset link)
 */
export async function updatePassword(formData: FormData): Promise<ActionResult<{ updated: boolean }>> {
  const ip = await getClientIp();

  try {
    await enforceRateLimit("auth", `update-pw:${ip}`);

    const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
    if (!parsed.success) {
      return errorResult(parsed.error.errors[0]?.message || "Invalid password format", "VALIDATION_FAILED");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return errorResult(error.message, "BAD_REQUEST");
    }

    return successResult({ updated: true });
  } catch {
    return errorResult("Failed to update password. Session may have expired.", "INTERNAL_ERROR");
  }
}

/**
 * Sign Out
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
