import { describe, it, expect } from "vitest";
import {
  parseEbur128Loudness,
  parseSceneChanges,
  calculateHighlightWindows,
} from "./scorer";

describe("Highlight Scorer Engine", () => {
  describe("parseEbur128Loudness", () => {
    it("parses valid ebur128 log output with momentary loudness values", () => {
      const sampleLog = `
[Parsed_ebur128_0 @ 0000021c1f2874c0] t: 0.1     M: -70.0 S: -70.0     I: -70.0 LUFS     LRA:   0.0 LU
[Parsed_ebur128_0 @ 0000021c1f2874c0] t: 0.2     M: -45.2 S: -50.1     I: -48.0 LUFS     LRA:   2.1 LU
[Parsed_ebur128_0 @ 0000021c1f2874c0] t: 0.3     M: -18.4 S: -22.3     I: -20.1 LUFS     LRA:   5.4 LU
[Parsed_ebur128_0 @ 0000021c1f2874c0] t: 0.4     M: -inf S: -inf     I: -70.0 LUFS
      `;

      const points = parseEbur128Loudness(sampleLog);
      expect(points).toHaveLength(4);
      expect(points[0]).toEqual({ timestamp: 0.1, momentaryLoudness: -70 });
      expect(points[1]).toEqual({ timestamp: 0.2, momentaryLoudness: -45.2 });
      expect(points[2]).toEqual({ timestamp: 0.3, momentaryLoudness: -18.4 });
      expect(points[3]).toEqual({ timestamp: 0.4, momentaryLoudness: -70 });
    });

    it("handles empty or corrupt logs gracefully", () => {
      expect(parseEbur128Loudness("")).toEqual([]);
      expect(parseEbur128Loudness("Random ffmpeg warning message")).toEqual([]);
    });
  });

  describe("parseSceneChanges", () => {
    it("parses showinfo pts_time scene cuts and deduplicates adjacent frames", () => {
      const sampleLog = `
[Parsed_showinfo_1 @ 0000021c1f2884c0] n:   15 pts: 15000 pts_time:5.234 pos:   12345
[Parsed_showinfo_1 @ 0000021c1f2884c0] n:   16 pts: 16000 pts_time:5.267 pos:   12450
[Parsed_showinfo_1 @ 0000021c1f2884c0] n:   80 pts: 80000 pts_time:22.500 pos:   45678
      `;

      const cuts = parseSceneChanges(sampleLog);
      expect(cuts).toHaveLength(2);
      expect(cuts[0]).toBe(5.234);
      // Second cut at 5.267 is within 0.2s deduplication threshold, so skipped
      expect(cuts[1]).toBe(22.5);
    });

    it("returns empty array for log with no scene changes", () => {
      expect(parseSceneChanges("No cuts detected")).toEqual([]);
    });
  });

  describe("calculateHighlightWindows", () => {
    it("returns single clip spanning whole duration if video is shorter than min duration", () => {
      const windows = calculateHighlightWindows({
        duration: 10,
        minClipDuration: 15,
        targetClipDuration: 20,
      });

      expect(windows).toHaveLength(1);
      const first = windows[0]!;
      expect(first.startTime).toBe(0);
      expect(first.endTime).toBe(10);
      expect(first.duration).toBe(10);
      expect(first.highlightScore).toBeGreaterThan(0);
    });

    it("returns empty array for zero or negative duration", () => {
      expect(calculateHighlightWindows({ duration: 0 })).toEqual([]);
      expect(calculateHighlightWindows({ duration: -5 })).toEqual([]);
    });

    it("prioritizes windows containing loud audio bursts and scene cuts", () => {
      // 90s video with a loud burst around t=20s and another around t=60s
      const loudnessPoints = [
        { timestamp: 5, momentaryLoudness: -50 },
        { timestamp: 10, momentaryLoudness: -48 },
        // Burst 1: t=20s
        { timestamp: 18, momentaryLoudness: -30 },
        { timestamp: 20, momentaryLoudness: -12 },
        { timestamp: 22, momentaryLoudness: -14 },
        { timestamp: 25, momentaryLoudness: -45 },
        // Quiet zone
        { timestamp: 40, momentaryLoudness: -50 },
        // Burst 2: t=60s
        { timestamp: 58, momentaryLoudness: -28 },
        { timestamp: 60, momentaryLoudness: -10 },
        { timestamp: 62, momentaryLoudness: -12 },
        { timestamp: 65, momentaryLoudness: -45 },
        { timestamp: 85, momentaryLoudness: -50 },
      ];

      const sceneTimestamps = [19, 21, 59, 61];

      const windows = calculateHighlightWindows({
        duration: 90,
        loudnessPoints,
        sceneTimestamps,
        targetClipDuration: 20,
        clipCount: 2,
        preRollSeconds: 2,
      });

      expect(windows).toHaveLength(2);

      // Verify non-overlapping property
      const clip1 = windows[0]!;
      const clip2 = windows[1]!;
      const overlaps = Math.max(clip1.startTime, clip2.startTime) < Math.min(clip1.endTime, clip2.endTime) - 2;
      expect(overlaps).toBe(false);

      // Verify clips align with the bursts
      // Burst 1 peak is at t=20, so with 2s pre-roll, clip should start around t=18
      // Burst 2 peak is at t=60, so with 2s pre-roll, clip should start around t=58
      const hasBurst1 = windows.some((w) => w.startTime <= 18 && w.endTime >= 22);
      const hasBurst2 = windows.some((w) => w.startTime <= 58 && w.endTime >= 62);

      expect(hasBurst1).toBe(true);
      expect(hasBurst2).toBe(true);

      // Highlight scores should be significant (> 0.5)
      expect(clip1.highlightScore).toBeGreaterThan(0.5);
      expect(clip2.highlightScore).toBeGreaterThan(0.5);
    });

    it("verifies naming compliance: strictly 'highlightScore' and never 'viralScore'", () => {
      const windows = calculateHighlightWindows({
        duration: 60,
        targetClipDuration: 20,
      });

      expect(windows.length).toBeGreaterThan(0);
      for (const window of windows) {
        expect(window).toHaveProperty("highlightScore");
        expect(window).not.toHaveProperty("viralScore");
        expect(window.highlightScore).toBeGreaterThanOrEqual(0);
        expect(window.highlightScore).toBeLessThanOrEqual(1);
      }
    });
  });
});
