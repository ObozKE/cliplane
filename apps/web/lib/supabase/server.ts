import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { AppError, isVipUser } from "@cliplane/shared";

/**
 * Creates a Supabase server client scoped to current request cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can be ignored in Server Components (read-only cookie store)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Can be ignored in Server Components
          }
        },
      },
    },
  );
}

/**
 * Creates a privileged service-role client strictly for trusted server procedures
 * NEVER exposed to client bundles.
 */
export function createServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error("FATAL: createServiceRoleClient invoked in client environment");
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service role operations");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "user" | "admin";
  bannedAt: string | null;
}

/**
 * Strictly verifies authentication session via supabase.auth.getUser()
 * NEVER trusts getSession() alone.
 * Checks banned_at status from public.profiles with self-healing profile creation.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw AppError.unauthorized("Authentication required. Please sign in.");
  }

  // Fetch profile to verify role and ban status
  let { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, banned_at")
    .eq("id", user.id)
    .single();

  const isVip = isVipUser(user.email);
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = user.email ? (adminEmails.includes(user.email.toLowerCase()) || isVip) : false;

  // Self-healing: if profile is missing (e.g. trigger didn't run or signup delay), auto-create it
  if (profileErr || !profile) {
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const serviceClient = createServiceRoleClient();
        const { data: createdProfile } = await serviceClient
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email ?? "",
              role: isAdmin ? "admin" : "user",
              priority_credits: isVip ? 9999 : 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          )
          .select("role, banned_at")
          .single();

        if (createdProfile) {
          profile = createdProfile;
        }
      }
    } catch {
      // Continue to fallback if service role operation fails
    }

    // Graceful fallback: do NOT crash valid sessions with 401 if profile row is pending
    if (!profile) {
      profile = {
        role: isAdmin ? "admin" : "user",
        banned_at: null,
      };
    }
  }

  if (profile.banned_at) {
    throw AppError.forbidden("Your account has been suspended for terms or copyright violations.");
  }

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile.role as "user" | "admin") || (isAdmin ? "admin" : "user"),
    bannedAt: profile.banned_at,
  };
}

/**
 * Verifies that the current user has the 'admin' role. Throws 404 (not 403) to prevent route disclosure.
 */
export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    user.role === "admin" ||
    (user.email &&
      (adminEmails.includes(user.email.toLowerCase()) || isVipUser(user.email)));

  if (!isAdmin) {
    // Return 404 so non-admins cannot discover admin endpoints
    throw AppError.notFound();
  }
  return { ...user, role: "admin" };
}
