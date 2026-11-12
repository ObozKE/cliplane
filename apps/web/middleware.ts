import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

  // 1. CORS & Origin validation for mutation requests
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const isDev = process.env.NODE_ENV !== "production";

  // Build full list of allowed origins
  const configuredOrigins = (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,https://cliplane.tech,https://www.cliplane.tech"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const isSameOrigin = Boolean(
    origin && (
      origin === request.nextUrl.origin ||
      (host && (origin === `http://${host}` || origin === `https://${host}`))
    )
  );

  const isDevOrigin = Boolean(
    isDev && origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  );

  const isAllowed = isSameOrigin || isDevOrigin || Boolean(origin && configuredOrigins.includes(origin));

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    if (origin && isAllowed) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, x-request-id, next-action, next-router-state-tree, rsc",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
  }

  if (origin && !isAllowed && ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    return new NextResponse(
      JSON.stringify({ error: "CORS origin rejected" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Strict Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https: ${supabaseUrl};
    media-src 'self' blob: data: https: ${supabaseUrl};
    font-src 'self' data:;
    connect-src 'self' ${supabaseUrl} ${supabaseUrl.replace("http://", "ws://").replace("https://", "wss://")};
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
  `.replace(/\s{2,}/g, " ").trim();

  // Create request headers with nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply standard security headers
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  if (origin && isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-request-id, next-action, next-router-state-tree, rsc",
    );
  }

  // 3. Supabase Auth Session Refresh & Route Protection
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value });
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "" });
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  // Use getUser() strictly to validate token against Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isServerAction = request.headers.has("next-action");

  // Protect /dashboard and /jobs
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/jobs")) {
    if (!user) {
      // If this is a Server Action POST, allow it through so the Server Action
      // can return a proper RSC action response or error rather than having
      // middleware return an HTML redirect that causes fetchServerAction to crash.
      if (!isServerAction) {
        const redirectUrl = new URL("/auth/login", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Protect /admin: non-admins receive rewrite to /not-found to prevent discovery
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, banned_at")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || profile.banned_at) {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }
  }

  // If already authenticated, redirect away from login/signup to dashboard
  if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
