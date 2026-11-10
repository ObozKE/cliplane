import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initiateCheckoutAction,
  redeemPriorityCreditAction,
} from "./actions";
import { executePaymentConfirmation } from "@/lib/payments";

const mockAlice = {
  id: "user-alice-1111",
  email: "alice@example.com",
};

let currentAuthenticatedUser = mockAlice;

const ALICE_JOB_ID = "11111111-1111-1111-1111-111111111111";
const BOB_JOB_ID = "22222222-2222-2222-2222-222222222222";

// In-memory mock database store for payments, jobs, and profiles
const dbStore = {
  profiles: new Map<string, { id: string; email: string; priority_credits: number }>([
    ["user-alice-1111", { id: "user-alice-1111", email: "alice@example.com", priority_credits: 0 }],
    ["user-bob-9999", { id: "user-bob-9999", email: "bob@example.com", priority_credits: 2 }],
  ]),
  jobs: new Map<string, { id: string; user_id: string; lane: "free" | "priority"; status: string }>([
    [ALICE_JOB_ID, { id: ALICE_JOB_ID, user_id: "user-alice-1111", lane: "free", status: "queued" }],
    [BOB_JOB_ID, { id: BOB_JOB_ID, user_id: "user-bob-9999", lane: "free", status: "queued" }],
  ]),
  payments: new Map<string, {
    id: string;
    user_id: string;
    job_id: string | null;
    amount: number;
    currency: string;
    status: "pending" | "completed" | "failed";
    checkout_request_id?: string;
    provider_tx_id?: string;
    metadata?: Record<string, unknown>;
  }>(),
};

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(async () => currentAuthenticatedUser),
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, val: string) => ({
              single: vi.fn(async () => {
                const profile = dbStore.profiles.get(val);
                return { data: profile ? { ...profile } : null, error: profile ? null : { message: "Not found" } };
              }),
            })),
          })),
          update: vi.fn((fields: Record<string, unknown>) => ({
            eq: vi.fn(async (_col: string, val: string) => {
              const profile = dbStore.profiles.get(val);
              if (profile) {
                Object.assign(profile, fields);
              }
              return { error: null };
            }),
          })),
        };
      }

      if (table === "jobs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col1: string, val1: string) => ({
              eq: vi.fn((_col2: string, val2: string) => ({
                single: vi.fn(async () => {
                  const job = dbStore.jobs.get(val1);
                  if (job && job.user_id === val2) {
                    return { data: { ...job }, error: null };
                  }
                  return { data: null, error: { message: "Job not found" } };
                }),
              })),
            })),
          })),
          update: vi.fn((fields: Record<string, unknown>) => ({
            eq: vi.fn(async (_col: string, val: string) => {
              const job = dbStore.jobs.get(val);
              if (job) {
                Object.assign(job, fields);
              }
              return { error: null };
            }),
          })),
        };
      }

      if (table === "payments") {
        return {
          insert: vi.fn((fields: Record<string, unknown>) => {
            const id = `pay_${Date.now()}_${Math.random()}`;
            const record = {
              id,
              user_id: String(fields.user_id),
              job_id: fields.job_id ? String(fields.job_id) : null,
              amount: Number(fields.amount),
              currency: String(fields.currency || "USD"),
              status: (fields.status || "pending") as "pending" | "completed",
              metadata: fields.metadata as Record<string, unknown>,
            };
            dbStore.payments.set(id, record);
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id }, error: null })),
              })),
            };
          }),
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: string) => ({
              limit: vi.fn(async () => {
                let found = null;
                for (const p of dbStore.payments.values()) {
                  if (col === "id" && p.id === val) found = p;
                  if (col === "checkout_request_id" && p.checkout_request_id === val) found = p;
                }
                return { data: found ? [found] : [], error: null };
              }),
            })),
          })),
          update: vi.fn((fields: Record<string, unknown>) => ({
            eq: vi.fn(async (_col: string, val: string) => {
              const p = dbStore.payments.get(val);
              if (p) {
                Object.assign(p, fields);
              }
              return { error: null };
            }),
          })),
        };
      }

      return {};
    }),
  })),
}));

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ success: true, remaining: 10, limit: 10, reset: 3600 })),
}));

describe("Payments & Priority Lane Upgrades", () => {
  beforeEach(() => {
    currentAuthenticatedUser = mockAlice;
    // Reset test data
    dbStore.jobs.set(ALICE_JOB_ID, { id: ALICE_JOB_ID, user_id: "user-alice-1111", lane: "free", status: "queued" });
    dbStore.jobs.set(BOB_JOB_ID, { id: BOB_JOB_ID, user_id: "user-bob-9999", lane: "free", status: "queued" });
    dbStore.profiles.set("user-alice-1111", { id: "user-alice-1111", email: "alice@example.com", priority_credits: 0 });
    dbStore.profiles.set("user-bob-9999", { id: "user-bob-9999", email: "bob@example.com", priority_credits: 2 });
    dbStore.payments.clear();
  });

  describe("IDOR Protection: initiateCheckoutAction", () => {
    it("allows user Alice to initiate checkout for her own job", async () => {
      const result = await initiateCheckoutAction({
        jobId: ALICE_JOB_ID,
        provider: "mock",
        isBundle: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkoutUrl).toContain("mock-confirm");
        expect(result.data.status).toBe("pending");
      }
    });

    it("prevents IDOR: Alice cannot initiate checkout for Bob's job", async () => {
      currentAuthenticatedUser = mockAlice;
      const result = await initiateCheckoutAction({
        jobId: BOB_JOB_ID,
        provider: "mock",
        isBundle: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
        expect(result.error).toContain("access denied");
      }
    });

    it("allows purchasing a 5-pack bundle without a specific job ID", async () => {
      const result = await initiateCheckoutAction({
        provider: "crypto",
        isBundle: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Atomic Confirmation & Idempotency: executePaymentConfirmation", () => {
    it("promotes job to priority lane upon payment confirmation", async () => {
      // Create a pending payment
      const paymentId = "pay_test_job_1";
      dbStore.payments.set(paymentId, {
        id: paymentId,
        user_id: "user-alice-1111",
        job_id: ALICE_JOB_ID,
        amount: 2.99,
        currency: "USD",
        status: "pending",
      });

      // Confirm payment
      const confirmation = await executePaymentConfirmation({
        paymentId,
        providerTxId: "tx_mock_12345",
        status: "completed",
      });

      expect(confirmation.success).toBe(true);
      expect(confirmation.laneUpdated).toBe(true);
      expect(confirmation.alreadyProcessed).toBe(false);

      // Verify job was promoted in DB
      const job = dbStore.jobs.get(ALICE_JOB_ID);
      expect(job?.lane).toBe("priority");

      // Verify payment marked completed
      const payment = dbStore.payments.get(paymentId);
      expect(payment?.status).toBe("completed");
    });

    it("guarantees idempotency: replaying confirmation does not re-apply", async () => {
      const paymentId = "pay_test_idempotent";
      dbStore.payments.set(paymentId, {
        id: paymentId,
        user_id: "user-alice-1111",
        job_id: ALICE_JOB_ID,
        amount: 2.99,
        currency: "USD",
        status: "completed", // Already completed
      });

      const replay = await executePaymentConfirmation({
        paymentId,
        providerTxId: "tx_duplicate_call",
        status: "completed",
      });

      expect(replay.success).toBe(true);
      expect(replay.alreadyProcessed).toBe(true);
      expect(replay.laneUpdated).toBe(false);
    });

    it("adds 5 priority credits to profile when confirming a bundle purchase", async () => {
      const paymentId = "pay_bundle_test";
      dbStore.payments.set(paymentId, {
        id: paymentId,
        user_id: "user-alice-1111",
        job_id: null, // Bundle purchase
        amount: 9.99,
        currency: "USD",
        status: "pending",
      });

      const confirmation = await executePaymentConfirmation({
        paymentId,
        providerTxId: "tx_bundle_123",
        status: "completed",
      });

      expect(confirmation.success).toBe(true);
      expect(confirmation.creditsAdded).toBe(5);

      const profile = dbStore.profiles.get("user-alice-1111");
      expect(profile?.priority_credits).toBe(5);
    });
  });

  describe("Credit Redemption: redeemPriorityCreditAction", () => {
    it("redeems 1 credit and promotes job when user has credits available", async () => {
      // Give Alice 1 credit
      dbStore.profiles.set("user-alice-1111", { id: "user-alice-1111", email: "alice@example.com", priority_credits: 1 });

      currentAuthenticatedUser = mockAlice;
      const result = await redeemPriorityCreditAction(ALICE_JOB_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.remainingCredits).toBe(0);
      }

      // Verify DB updates
      const job = dbStore.jobs.get(ALICE_JOB_ID);
      expect(job?.lane).toBe("priority");

      const profile = dbStore.profiles.get("user-alice-1111");
      expect(profile?.priority_credits).toBe(0);
    });

    it("rejects redemption when user has 0 credits", async () => {
      // Alice has 0 credits
      dbStore.profiles.set("user-alice-1111", { id: "user-alice-1111", email: "alice@example.com", priority_credits: 0 });

      currentAuthenticatedUser = mockAlice;
      const result = await redeemPriorityCreditAction(ALICE_JOB_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("PAYMENT_REQUIRED");
      }
    });

    it("prevents IDOR: Alice cannot redeem credit on Bob's job", async () => {
      // Give Alice 5 credits
      dbStore.profiles.set("user-alice-1111", { id: "user-alice-1111", email: "alice@example.com", priority_credits: 5 });

      currentAuthenticatedUser = mockAlice;
      const result = await redeemPriorityCreditAction(BOB_JOB_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND");
      }
    });
  });
});
