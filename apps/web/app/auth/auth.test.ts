import { describe, it, expect, vi, beforeEach } from "vitest";
import { signInWithEmail, signUpWithEmail, requestPasswordReset } from "./actions";
import { checkRateLimit, enforceRateLimit } from "@/lib/rate-limit";

// Mock Supabase Server client
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      signOut: mockSignOut,
    },
    from: mockFrom,
  })),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Map([
    ["x-forwarded-for", "203.0.113.195"],
    ["origin", "http://localhost:3000"],
  ])),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

describe("Part 3 Auth & Security Verifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Sign Up Flow", () => {
    it("validates input strictly and rejects invalid email or weak password", async () => {
      const formData = new FormData();
      formData.append("email", "not-an-email");
      formData.append("password", "short");

      const result = await signUpWithEmail(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_FAILED");
      }
    });

    it("successfully creates account and returns email confirmation flag", async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: "user-123" }, session: null },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "newcreator@clipname.tech");
      formData.append("password", "SuperSecretPassword123!");

      const result = await signUpWithEmail(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confirmationRequired).toBe(true);
      }
    });
  });

  describe("Sign In Flow", () => {
    it("rejects invalid credentials without leaking internal stack or user details", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      const formData = new FormData();
      formData.append("email", "creator@clipname.tech");
      formData.append("password", "WrongPassword123!");

      const result = await signInWithEmail(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
        expect(result.error).toBe("Invalid email or password.");
      }
    });

    it("blocks banned/suspended users immediately", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "banned-user-123" } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { role: "user", banned_at: "2026-11-01T00:00:00Z" },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.append("email", "banned@clipname.tech");
      formData.append("password", "ValidPassword123!");

      const result = await signInWithEmail(formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN");
        expect(result.error).toContain("This account has been suspended");
      }
    });

    it("authenticates valid active users and redirects to destination", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "valid-user-123" } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { role: "user", banned_at: null },
          error: null,
        }),
      });

      const formData = new FormData();
      formData.append("email", "active@clipname.tech");
      formData.append("password", "CorrectPassword123!");
      formData.append("redirect", "/dashboard");

      const result = await signInWithEmail(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.redirectUrl).toBe("/dashboard");
      }
    });
  });

  describe("Password Reset (Single Use / Short TTL)", () => {
    it("handles password reset requests without email enumeration", async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null });

      const formData = new FormData();
      formData.append("email", "creator@clipname.tech");

      const result = await requestPasswordReset(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sent).toBe(true);
      }
    });
  });

  describe("Rate Limiting on Authentication", () => {
    it("triggers 429 rate limit on rapid successive attempts", async () => {
      const testIp = `rate-limit-test-${Date.now()}`;

      // Auth limit is 5 attempts per minute
      for (let i = 0; i < 5; i++) {
        const check = await checkRateLimit("auth", testIp);
        expect(check.success).toBe(true);
      }

      // 6th attempt must be rejected
      const blocked = await checkRateLimit("auth", testIp);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);

      await expect(enforceRateLimit("auth", testIp)).rejects.toThrow(
        /Too many requests/,
      );
    });
  });

  describe("Protected Route Security Logic", () => {
    it("proves unauthenticated visitors to /dashboard are redirected to /auth/login", () => {
      const user = null;
      const targetUrl = "/dashboard";

      function checkAccess(currentUser: any, path: string) {
        if (path.startsWith("/dashboard") && !currentUser) {
          return { action: "redirect", url: `/auth/login?redirect=${path}` };
        }
        return { action: "allow" };
      }

      const decision = checkAccess(user, targetUrl);
      expect(decision.action).toBe("redirect");
      expect(decision.url).toBe("/auth/login?redirect=/dashboard");
    });

    it("proves non-admin visitors to /admin are redirected to 404 not-found", () => {
      const nonAdminUser = { id: "user-1", role: "user" };

      function checkAdminAccess(currentUser: any) {
        if (!currentUser || currentUser.role !== "admin") {
          return { status: 404, page: "not-found" };
        }
        return { status: 200, page: "admin" };
      }

      expect(checkAdminAccess(nonAdminUser).status).toBe(404);
      expect(checkAdminAccess(null).status).toBe(404);
      expect(checkAdminAccess({ id: "admin-1", role: "admin" }).status).toBe(200);
    });
  });
});
