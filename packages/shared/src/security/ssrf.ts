import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { AppError } from "../errors/index";

const BLOCKED_HOST_PATTERNS = [
  /^(www\.)?youtube\.com$/i,
  /^youtu\.be$/i,
  /^(www\.)?tiktok\.com$/i,
  /^(www\.)?twitch\.tv$/i,
  /^(www\.)?instagram\.com$/i,
  /^(www\.)?twitter\.com$/i,
  /^(www\.)?x\.com$/i,
  /^(www\.)?facebook\.com$/i,
  /^(www\.)?reddit\.com$/i,
];

/**
 * Checks whether a given URL string points to a supported YouTube video URL.
 */
export function isYouTubeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    const isYtHost =
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be";

    return (
      isYtHost &&
      (parsed.protocol === "https:" || parsed.protocol === "http:")
    );
  } catch {
    return false;
  }
}

/**
 * Checks whether an IP address is private, loopback, link-local, carrier-grade NAT, or cloud metadata.
 */
export function isPrivateOrReservedIP(ipString: string): boolean {
  try {
    let addr = ipaddr.parse(ipString);
    if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
      addr = (addr as ipaddr.IPv6).toIPv4Address();
    }

    const range = addr.range();
    const forbiddenRanges = [
      "unspecified",
      "broadcast",
      "linkLocal",
      "loopback",
      "private",
      "carrierGradeNat",
      "uniqueLocal",
    ];

    if (forbiddenRanges.includes(range)) {
      return true;
    }

    // Additional explicit checks for cloud metadata endpoints (e.g., 169.254.169.254)
    const ipStr = addr.toString();
    if (ipStr.startsWith("169.254.") || ipStr.startsWith("127.") || ipStr.startsWith("10.") || ipStr === "0.0.0.0") {
      return true;
    }

    return false;
  } catch {
    return true; // Reject unparseable IP as hostile
  }
}

/**
 * Validates direct video URL format, detects blocked platform URLs,
 * resolves DNS and verifies the target IP is publicly routable.
 */
export async function validateDirectVideoUrl(urlString: string): Promise<{
  validUrl: URL;
  resolvedIp: string;
}> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    throw AppError.badRequest("Invalid URL format.", "INVALID_URL");
  }

  // Must be HTTPS (or HTTP in local dev/test if specifically targeting mock)
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw AppError.badRequest("Only HTTP/HTTPS URLs are supported.", "INVALID_URL");
  }

  // Check social page URLs
  const hostname = parsedUrl.hostname.toLowerCase();
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      throw AppError.badRequest(
        "YouTube, TikTok, and social page URLs are not supported. Paste a direct video link (ending in .mp4, etc.) or upload the file directly.",
        "INVALID_URL",
      );
    }
  }

  // Check if hostname itself is directly an IP
  if (ipaddr.isValid(hostname)) {
    if (isPrivateOrReservedIP(hostname)) {
      throw AppError.badRequest("Target host is not an allowed public address.", "SSRF_DETECTED");
    }
    return { validUrl: parsedUrl, resolvedIp: hostname };
  }

  // Resolve DNS to verify IP
  try {
    const lookupResults = await dns.lookup(hostname, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      throw AppError.badRequest("Failed to resolve hostname.", "INVALID_URL");
    }

    for (const record of lookupResults) {
      if (isPrivateOrReservedIP(record.address)) {
        throw AppError.badRequest(
          "Target host resolves to a private or restricted IP address.",
          "SSRF_DETECTED",
        );
      }
    }

    const pinnedIp = lookupResults[0]!.address;
    return { validUrl: parsedUrl, resolvedIp: pinnedIp };
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw AppError.badRequest(
      "Unable to verify target video host. Please ensure the domain is public and reachable.",
      "INVALID_URL",
    );
  }
}
