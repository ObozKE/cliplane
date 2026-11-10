import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllTutorials, getTutorialBySlug } from "@/lib/tutorials";
import {
  getTutorialProgressAction,
  toggleTutorialProgressAction,
} from "./actions";

const mockAlice = {
  id: "user-alice-1111",
  email: "alice@example.com",
};

let currentAuthenticatedUser: { id: string; email: string } | null = mockAlice;

// In-memory mock database store for tutorial progress
const dbTutorialProgress = new Set<string>(); // composite: `${userId}:${slug}`

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(async () => {
    if (!currentAuthenticatedUser) {
      throw new Error("Unauthorized");
    }
    return currentAuthenticatedUser;
  }),
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "tutorial_progress") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col1: string, val1: string) => ({
              eq: vi.fn((_col2: string, val2: string) => ({
                maybeSingle: vi.fn(async () => {
                  const key = `${val1}:${val2}`;
                  if (dbTutorialProgress.has(key)) {
                    return { data: { id: "prog-1", tutorial_slug: val2 }, error: null };
                  }
                  return { data: null, error: null };
                }),
              })),
              // single eq call for list
              then: (resolve: any) => {
                const results: { tutorial_slug: string }[] = [];
                for (const item of dbTutorialProgress) {
                  const parts = item.split(":");
                  if (parts[0] === val1 && parts[1]) {
                    results.push({ tutorial_slug: parts[1] });
                  }
                }
                return resolve({ data: results, error: null });
              },
            })),
          })),
          insert: vi.fn(async (fields: { user_id: string; tutorial_slug: string }) => {
            const key = `${fields.user_id}:${fields.tutorial_slug}`;
            dbTutorialProgress.add(key);
            return { error: null };
          }),
          delete: vi.fn(() => ({
            eq: vi.fn((_col1: string, val1: string) => ({
              eq: vi.fn(async (_col2: string, val2: string) => {
                const key = `${val1}:${val2}`;
                dbTutorialProgress.delete(key);
                return { error: null };
              }),
            })),
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

describe("Part 8 — Tutorials & Curriculum", () => {
  beforeEach(() => {
    currentAuthenticatedUser = mockAlice;
    dbTutorialProgress.clear();
  });

  describe("Content Integrity & Structure", () => {
    it("loads all 6 mandatory tutorial lessons in correct sequence", () => {
      const tutorials = getAllTutorials();
      expect(tutorials).toHaveLength(6);

      const expectedSlugs = [
        "how-the-clipper-works",
        "recording-clean-gameplay",
        "what-makes-a-clip-hold-attention",
        "posting-to-shorts-reels-tiktok",
        "game-footage-rules",
        "platform-monetization-requirements",
      ];

      expect(tutorials.map((t) => t.slug)).toEqual(expectedSlugs);
      expect(tutorials.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("ensures each tutorial has required metadata (category, readTime, summary)", () => {
      const tutorials = getAllTutorials();
      for (const tutorial of tutorials) {
        expect(tutorial.title).toBeTruthy();
        expect(tutorial.category).toBeTruthy();
        expect(tutorial.readTime).toBeGreaterThan(0);
        expect(tutorial.summary).toBeTruthy();
      }
    });

    it("verifies Lesson 5 (game-footage-rules) contains official publisher links and mandatory disclaimers", () => {
      const lesson = getTutorialBySlug("game-footage-rules");
      expect(lesson).not.toBeNull();
      if (lesson) {
        // Official policy links
        expect(lesson.content).toContain("https://support.rockstargames.com/articles/200153756/Policy-on-posting-copyrighted-Rockstar-Games-material");
        expect(lesson.content).toContain("https://store.steampowered.com/video_policy");
        expect(lesson.content).toContain("https://www.blizzard.com/en-us/legal/dd7642f3-363c-4452-b8ec-687004d7168d/blizzard-video-policy");
        expect(lesson.content).toContain("https://www.ea.com/terms-of-service");
        expect(lesson.content).toContain("https://www.xbox.com/en-us/developers/rules");

        // Mandatory disclaimer
        expect(lesson.content).toContain("Results vary. ClipLane is a clipping tool and does not guarantee views, followers, or earnings.");
        expect(lesson.content).toContain("Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.");
      }
    });

    it("verifies Lesson 6 (platform-monetization-requirements) adheres to truthful claims (no get-rich-quick)", () => {
      const lesson = getTutorialBySlug("platform-monetization-requirements");
      expect(lesson).not.toBeNull();
      if (lesson) {
        expect(lesson.content).toContain("YouTube Partner Program");
        expect(lesson.content).toContain("10 million valid public Shorts views");
        expect(lesson.content).toContain("Reused Content");
        expect(lesson.content).toContain("Results vary.");
      }
    });

    it("provides correct prev/next adjacent links for lessons", () => {
      const first = getTutorialBySlug("how-the-clipper-works");
      expect(first?.prev).toBeUndefined();
      expect(first?.next?.slug).toBe("recording-clean-gameplay");

      const middle = getTutorialBySlug("what-makes-a-clip-hold-attention");
      expect(middle?.prev?.slug).toBe("recording-clean-gameplay");
      expect(middle?.next?.slug).toBe("posting-to-shorts-reels-tiktok");

      const last = getTutorialBySlug("platform-monetization-requirements");
      expect(last?.prev?.slug).toBe("game-footage-rules");
      expect(last?.next).toBeUndefined();
    });
  });

  describe("Tutorial Progress Server Actions", () => {
    it("returns empty completedSlugs for guest/unauthenticated user without throwing", async () => {
      currentAuthenticatedUser = null;
      const result = await getTutorialProgressAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completedSlugs).toEqual([]);
      }
    });

    it("allows authenticated user to toggle completion status on and off", async () => {
      currentAuthenticatedUser = mockAlice;

      // 1. Mark as complete
      const markResult = await toggleTutorialProgressAction("how-the-clipper-works");
      expect(markResult.success).toBe(true);
      if (markResult.success) {
        expect(markResult.data.completed).toBe(true);
        expect(markResult.data.slug).toBe("how-the-clipper-works");
      }

      // 2. Fetch progress: should contain slug
      const progress1 = await getTutorialProgressAction();
      expect(progress1.success).toBe(true);
      if (progress1.success) {
        expect(progress1.data.completedSlugs).toContain("how-the-clipper-works");
      }

      // 3. Toggle again: should uncomplete
      const unmarkResult = await toggleTutorialProgressAction("how-the-clipper-works");
      expect(unmarkResult.success).toBe(true);
      if (unmarkResult.success) {
        expect(unmarkResult.data.completed).toBe(false);
      }

      // 4. Fetch progress: should no longer contain slug
      const progress2 = await getTutorialProgressAction();
      expect(progress2.success).toBe(true);
      if (progress2.success) {
        expect(progress2.data.completedSlugs).not.toContain("how-the-clipper-works");
      }
    });

    it("rejects malicious or invalid slug inputs (path traversal defense)", async () => {
      currentAuthenticatedUser = mockAlice;

      const badInputs = [
        "../../etc/passwd",
        "lesson;DROP TABLE users;--",
        "<script>alert(1)</script>",
        "",
      ];

      for (const bad of badInputs) {
        const result = await toggleTutorialProgressAction(bad);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe("VALIDATION_FAILED");
        }
      }
    });

    it("requires authentication to toggle progress", async () => {
      currentAuthenticatedUser = null;
      const result = await toggleTutorialProgressAction("how-the-clipper-works");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
