import { describe, it, expect } from "vitest";
import { isPrivateOrReservedIP, validateDirectVideoUrl } from "./ssrf";
import { AppError } from "../errors/index";

describe("SSRF Protection & IP Range Checker", () => {
  it("blocks private, loopback, and metadata IPv4 ranges", () => {
    // Loopback
    expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("127.0.1.5")).toBe(true);

    // RFC 1918 Private ranges
    expect(isPrivateOrReservedIP("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("172.31.255.255")).toBe(true);
    expect(isPrivateOrReservedIP("192.168.1.1")).toBe(true);

    // Cloud Metadata & Link Local (169.254.169.254)
    expect(isPrivateOrReservedIP("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIP("169.254.1.1")).toBe(true);

    // 0.0.0.0
    expect(isPrivateOrReservedIP("0.0.0.0")).toBe(true);
  });

  it("blocks IPv6 loopback and unique local addresses", () => {
    // IPv6 Loopback
    expect(isPrivateOrReservedIP("::1")).toBe(true);

    // IPv6 Unique Local (fc00::/7)
    expect(isPrivateOrReservedIP("fc00::1")).toBe(true);
    expect(isPrivateOrReservedIP("fd12:3456:789a::1")).toBe(true);

    // IPv4-mapped IPv6 pointing to private addresses
    expect(isPrivateOrReservedIP("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("::ffff:10.0.0.1")).toBe(true);
  });

  it("allows legitimate public IP addresses", () => {
    // Google Public DNS
    expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
    // Cloudflare Public DNS
    expect(isPrivateOrReservedIP("1.1.1.1")).toBe(false);
  });

  it("rejects non-video platform URLs (YouTube, TikTok, Twitch)", async () => {
    await expect(validateDirectVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).rejects.toThrow(
      /YouTube, TikTok, and social page URLs are not supported/,
    );

    await expect(validateDirectVideoUrl("https://youtu.be/dQw4w9WgXcQ")).rejects.toThrow(
      /YouTube, TikTok, and social page URLs are not supported/,
    );

    await expect(validateDirectVideoUrl("https://www.tiktok.com/@user/video/1234567890")).rejects.toThrow(
      /YouTube, TikTok, and social page URLs are not supported/,
    );

    await expect(validateDirectVideoUrl("https://twitch.tv/streamer")).rejects.toThrow(
      /YouTube, TikTok, and social page URLs are not supported/,
    );
  });

  it("rejects local/private IP URLs immediately", async () => {
    await expect(validateDirectVideoUrl("http://127.0.0.1:8080/video.mp4")).rejects.toThrow(
      AppError,
    );

    await expect(validateDirectVideoUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      AppError,
    );
  });
});
