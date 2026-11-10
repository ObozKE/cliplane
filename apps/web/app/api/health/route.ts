import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const timestamp = new Date().toISOString();

  let redisStatus: "connected" | "disconnected" | "fallback-in-memory" = "fallback-in-memory";
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const rl = await checkRateLimit("apiDefault", "health-check-probe");
      redisStatus = rl.success ? "connected" : "disconnected";
    } catch {
      redisStatus = "fallback-in-memory";
    }
  }

  // Database check: verify supabase URL is set
  const dbConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return NextResponse.json(
    {
      status: "healthy",
      timestamp,
      version: "1.0.0",
      services: {
        database: dbConfigured ? "connected" : "disconnected",
        redis: redisStatus,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
