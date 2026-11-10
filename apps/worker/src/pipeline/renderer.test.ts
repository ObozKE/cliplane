import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  probeVideo,
  analyzeAudioAndScenes,
  renderVerticalClip,
  renderThumbnail,
  generateSyntheticTestVideo,
} from "./renderer";
import { calculateHighlightWindows } from "./scorer";
import { AppError } from "@cliplane/shared";

describe("FFmpeg Renderer & Video Pipeline", () => {
  let testDir: string;
  let syntheticVideoPath: string;

  beforeAll(async () => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "cliplane_test_"));
    syntheticVideoPath = path.join(testDir, "test_gameplay_fixture.mp4");

    // Generate a 60-second synthetic gameplay fixture with audio bursts at 10s, 30s, and 50s
    await generateSyntheticTestVideo({
      outputPath: syntheticVideoPath,
      durationSeconds: 60,
      burstTimestamps: [10, 30, 50],
    });
  }, 120_000);

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("probeVideo", () => {
    it("probes valid MP4 video and extracts duration, resolution, codec, and audio", async () => {
      const probe = await probeVideo(syntheticVideoPath, 300);

      expect(probe.duration).toBeGreaterThanOrEqual(59);
      expect(probe.duration).toBeLessThanOrEqual(61);
      expect(probe.videoStream.width).toBe(1920);
      expect(probe.videoStream.height).toBe(1080);
      expect(probe.videoStream.codec).toBe("h264");
      expect(probe.hasAudio).toBe(true);
      expect(probe.sizeBytes).toBeGreaterThan(0);
    });

    it("throws FILE_NOT_FOUND when probing non-existent file", async () => {
      await expect(
        probeVideo(path.join(testDir, "does_not_exist.mp4")),
      ).rejects.toThrowError(AppError);

      try {
        await probeVideo(path.join(testDir, "does_not_exist.mp4"));
      } catch (err) {
        expect((err as AppError).code).toBe("FILE_NOT_FOUND");
      }
    });

    it("throws INVALID_VIDEO_FORMAT when probing corrupt file", async () => {
      const corruptFile = path.join(testDir, "corrupt.mp4");
      fs.writeFileSync(corruptFile, "Not a valid MP4 header or container data");

      await expect(probeVideo(corruptFile)).rejects.toThrowError(AppError);

      try {
        await probeVideo(corruptFile);
      } catch (err) {
        expect((err as AppError).code).toBe("INVALID_VIDEO_FORMAT");
      }
    });

    it("throws DURATION_EXCEEDED when video exceeds maximum allowed duration", async () => {
      await expect(probeVideo(syntheticVideoPath, 30)).rejects.toThrowError(
        AppError,
      );

      try {
        await probeVideo(syntheticVideoPath, 30);
      } catch (err) {
        expect((err as AppError).code).toBe("DURATION_EXCEEDED");
      }
    });
  });

  describe("analyzeAudioAndScenes & calculateHighlightWindows", () => {
    it("detects audio loudness bursts and extracts 3 highlight windows matching burst timestamps", async () => {
      const { loudnessPoints, sceneTimestamps } = await analyzeAudioAndScenes(
        syntheticVideoPath,
        true,
      );

      expect(loudnessPoints.length).toBeGreaterThan(0);

      const windows = calculateHighlightWindows({
        duration: 60,
        loudnessPoints,
        sceneTimestamps,
        targetClipDuration: 15,
        minClipDuration: 15,
        maxClipDuration: 20,
        clipCount: 3,
        preRollSeconds: 2,
      });

      expect(windows).toHaveLength(3);

      // Verify that the windows align with the bursts generated at 10s, 30s, and 50s
      // With 2s pre-roll, bursts at 10s, 30s, 50s will have windows starting near 8s, 28s, 48s
      for (const win of windows) {
        expect(win.duration).toBeGreaterThanOrEqual(15);
        expect(win.highlightScore).toBeGreaterThan(0);
      }

      // Check that non-overlapping invariant holds
      for (let i = 0; i < windows.length - 1; i++) {
        const current = windows[i]!;
        const next = windows[i + 1]!;
        expect(current.endTime).toBeLessThanOrEqual(next.startTime + 2);
      }
    }, 60_000);
  });

  describe("renderVerticalClip & renderThumbnail", () => {
    it("renders 1080x1920 (9:16) vertical clip with blurred-background fill and thumbnail", async () => {
      const clipOutput = path.join(testDir, "test_clip_vertical.mp4");
      const thumbOutput = path.join(testDir, "test_thumbnail.jpg");

      // 1. Render vertical clip
      const renderRes = await renderVerticalClip({
        inputPath: syntheticVideoPath,
        outputPath: clipOutput,
        startTime: 8,
        duration: 5,
      });

      expect(fs.existsSync(clipOutput)).toBe(true);
      expect(renderRes.sizeBytes).toBeGreaterThan(0);

      // 2. Probe rendered clip to verify exact 1080x1920 vertical resolution
      const clipProbe = await probeVideo(clipOutput, 30);
      expect(clipProbe.videoStream.width).toBe(1080);
      expect(clipProbe.videoStream.height).toBe(1920);
      expect(clipProbe.duration).toBeGreaterThanOrEqual(4);
      expect(clipProbe.duration).toBeLessThanOrEqual(6);

      // 3. Render thumbnail
      const thumbRes = await renderThumbnail({
        inputPath: clipOutput,
        outputPath: thumbOutput,
        timestamp: 1,
      });

      expect(fs.existsSync(thumbOutput)).toBe(true);
      const thumbStat = fs.statSync(thumbRes.outputPath);
      expect(thumbStat.size).toBeGreaterThan(0);
    }, 60_000);
  });
});
