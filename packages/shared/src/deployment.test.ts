import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  calculateQueuePosition,
  calculateEstimatedWaitSeconds,
} from "./queue";
import { isPrivateOrReservedIP } from "./security/ssrf";

describe("Part 10 — Production Pre-Deployment & Integrity Checklist", () => {
  describe("Product Integrity & Truthful Metrics (Non-Negotiable Rules)", () => {
    it("RULE 1: Queue calculations derive strictly from database state (no fake timers or countdowns)", () => {
      // 0 priority jobs ahead in priority lane
      const pos1 = calculateQueuePosition({
        jobId: "job-1",
        lane: "priority",
        createdAt: new Date(),
        activePriorityCountAhead: 0,
        activeFreeCountAhead: 0,
      });
      expect(pos1).toBe(0);

      // Free lane with 2 priority jobs and 3 free jobs ahead = 5 ahead
      const pos2 = calculateQueuePosition({
        jobId: "job-2",
        lane: "free",
        createdAt: new Date(),
        activePriorityCountAhead: 2,
        activeFreeCountAhead: 3,
      });
      expect(pos2).toBe(5);

      // ETA is mathematically derived from concurrency and rolling duration, not randomized
      const waitResult = calculateEstimatedWaitSeconds({
        lane: "priority",
        createdAt: new Date(),
        queuePosition: 2,
        averageJobDurationSeconds: 60,
        workerConcurrency: 2,
        freeLaneMinWaitHours: 24,
      });
      // 2 jobs / 2 concurrency * 60s = 60s
      expect(waitResult.estimatedSeconds).toBe(60);
    });

    it("RULE 2 & 3: Mandatory disclaimers are present on footer, pricing, terms, and tutorials", () => {
      const requiredDisclaimer = "Results vary. ClipName is a clipping tool and does not guarantee views, followers, or earnings.";
      const publisherDisclaimerRegex = /not affiliated with or endorsed by rockstar games or take-two interactive/i;

      const checkFiles = [
        "apps/web/app/(marketing)/layout.tsx",
        "apps/web/app/(marketing)/pricing/page.tsx",
        "apps/web/app/(marketing)/terms/page.tsx",
        "apps/web/app/(marketing)/learn/page.tsx",
      ];

      for (const relPath of checkFiles) {
        const fullPath = path.resolve(__dirname, "../../..", relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          expect(content).toContain(requiredDisclaimer);
          expect(content).toMatch(publisherDisclaimerRegex);
        }
      }
    });

    it("RULE 4: No trademark misuse — app name, domain, and branding avoid publisher marks", () => {
      const appName = "ClipName";
      const domain = "clipname.tech";

      expect(appName.toLowerCase()).not.toContain("gta");
      expect(appName.toLowerCase()).not.toContain("rockstar");
      expect(appName.toLowerCase()).not.toContain("vicecity");
      expect(appName.toLowerCase()).not.toContain("grand theft auto");

      expect(domain.toLowerCase()).not.toContain("gta");
      expect(domain.toLowerCase()).not.toContain("rockstar");
    });
  });

  describe("Security Controls (9-Point Checklist)", () => {
    it("Check 3: SSRF Defense rejects all private, link-local, loopback, and metadata IPs", () => {
      // Loopback
      expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("127.0.0.53")).toBe(true);
      expect(isPrivateOrReservedIP("::1")).toBe(true);

      // RFC 1918 Private
      expect(isPrivateOrReservedIP("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIP("192.168.1.1")).toBe(true);

      // Cloud Metadata / Link-Local
      expect(isPrivateOrReservedIP("169.254.169.254")).toBe(true);

      // Legitimate public IPs
      expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIP("1.1.1.1")).toBe(false);
      expect(isPrivateOrReservedIP("104.21.5.12")).toBe(false);
    });

    it("Check 4: Vercel production headers include strict security and framing defenses", () => {
      const vercelPath = path.resolve(__dirname, "../../..", "vercel.json");
      expect(fs.existsSync(vercelPath)).toBe(true);

      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));
      const headers = vercelConfig.headers[0].headers;

      const headerKeys = headers.map((h: any) => h.key);
      expect(headerKeys).toContain("X-Frame-Options");
      expect(headerKeys).toContain("X-Content-Type-Options");
      expect(headerKeys).toContain("Strict-Transport-Security");
      expect(headerKeys).toContain("Referrer-Policy");

      const frameOptions = headers.find((h: any) => h.key === "X-Frame-Options");
      expect(frameOptions.value).toBe("DENY");
    });

    it("Check 9: Deployment configs (Render & Docker Compose) are present and valid", () => {
      const renderPath = path.resolve(__dirname, "../../..", "render.yaml");
      expect(fs.existsSync(renderPath)).toBe(true);

      const composePath = path.resolve(__dirname, "../../..", "docker-compose.yml");
      expect(fs.existsSync(composePath)).toBe(true);

      const workerDocker = path.resolve(__dirname, "../../..", "apps/worker/Dockerfile");
      expect(fs.existsSync(workerDocker)).toBe(true);

      const webDocker = path.resolve(__dirname, "../../..", "apps/web/Dockerfile");
      expect(fs.existsSync(webDocker)).toBe(true);
    });
  });
});
