import type { NextConfig } from "next";

const rawOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "localhost:3000,localhost:3001,localhost:3002,127.0.0.1:3000,127.0.0.1:3001,127.0.0.1:3002,cliplane.tech,www.cliplane.tech"
)
  .split(",")
  .map((o) => o.trim().replace(/^https?:\/\//, ""))
  .filter(Boolean);

const defaultDevHosts = [
  "localhost:3000",
  "localhost:3001",
  "localhost:3002",
  "localhost:3003",
  "localhost:3004",
  "localhost:3005",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
  "127.0.0.1:3002",
  "127.0.0.1:3003",
  "127.0.0.1:3004",
  "127.0.0.1:3005",
  "cliplane.tech",
  "www.cliplane.tech",
];

const allowedOrigins = Array.from(new Set([...rawOrigins, ...defaultDevHosts]));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@cliplane/shared"],
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
