import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { AppError } from "@cliplane/shared";
import {
  parseEbur128Loudness,
  parseSceneChanges,
  type LoudnessPoint,
} from "./scorer";

export interface VideoStreamInfo {
  codec: string;
  width: number;
  height: number;
}

export interface VideoProbeResult {
  duration: number;
  sizeBytes: number;
  formatName: string;
  videoStream: VideoStreamInfo;
  hasAudio: boolean;
}

export interface RenderClipOptions {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
}

export interface RenderThumbnailOptions {
  inputPath: string;
  outputPath: string;
  timestamp: number;
}

const ALLOWED_VIDEO_CODECS = new Set([
  "h264",
  "hevc",
  "vp8",
  "vp9",
  "av1",
  "prores",
  "mpeg4",
]);

/**
 * Resolves binary paths for ffmpeg and ffprobe.
 * Auto-detects environment variables, PATH, and common WinGet installation locations.
 */
export function getBinaryPaths(): { ffmpeg: string; ffprobe: string } {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    const ffprobe =
      process.env.FFPROBE_PATH ||
      path.join(path.dirname(process.env.FFMPEG_PATH), "ffprobe.exe");
    return { ffmpeg: process.env.FFMPEG_PATH, ffprobe };
  }

  // Check common WinGet package path on Windows
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    const wingetBase = path.join(
      process.env.LOCALAPPDATA,
      "Microsoft",
      "WinGet",
      "Packages",
    );
    if (fs.existsSync(wingetBase)) {
      try {
        const entries = fs.readdirSync(wingetBase);
        const gyanPkg = entries.find((e) => e.startsWith("Gyan.FFmpeg"));
        if (gyanPkg) {
          const binDir = path.join(
            wingetBase,
            gyanPkg,
            "ffmpeg-9.0.2-full_build",
            "bin",
          );
          const ffmpegExe = path.join(binDir, "ffmpeg.exe");
          const ffprobeExe = path.join(binDir, "ffprobe.exe");
          if (fs.existsSync(ffmpegExe) && fs.existsSync(ffprobeExe)) {
            return { ffmpeg: ffmpegExe, ffprobe: ffprobeExe };
          }
        }
      } catch {
        // Fall back to default
      }
    }

    const wingetLinkFfmpeg = path.join(
      process.env.LOCALAPPDATA,
      "Microsoft",
      "WinGet",
      "Links",
      "ffmpeg.exe",
    );
    const wingetLinkFfprobe = path.join(
      process.env.LOCALAPPDATA,
      "Microsoft",
      "WinGet",
      "Links",
      "ffprobe.exe",
    );
    if (fs.existsSync(wingetLinkFfmpeg) && fs.existsSync(wingetLinkFfprobe)) {
      return { ffmpeg: wingetLinkFfmpeg, ffprobe: wingetLinkFfprobe };
    }
  }

  return {
    ffmpeg: process.env.FFMPEG_PATH || "ffmpeg",
    ffprobe: process.env.FFPROBE_PATH || "ffprobe",
  };
}

/**
 * Executes a binary with arguments using child_process.spawn.
 * Security: Uses argv array to completely prevent shell injection.
 */
export function runProcess(
  binary: string,
  args: string[],
  timeoutMs = 120_000,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const proc = spawn(binary, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(
        new AppError({
          code: "PROCESSING_TIMEOUT",
          message: `Process ${binary} exceeded timeout of ${timeoutMs}ms`,
          status: 504,
        }),
      );
    }, timeoutMs);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(
        new AppError({
          code: "COMMAND_EXECUTION_FAILED",
          message: `Failed to execute ${binary}: ${err.message}`,
          status: 500,
        }),
      );
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new AppError({
            code: "COMMAND_EXIT_NONZERO",
            message: `Command ${binary} exited with code ${code}. Stderr: ${stderr.slice(-500)}`,
            status: 500,
          }),
        );
      }
    });
  });
}

/**
 * Validates and inspects an input video file using ffprobe.
 */
export async function probeVideo(
  filePath: string,
  maxDurationSeconds = 300,
): Promise<VideoProbeResult> {
  if (!fs.existsSync(filePath)) {
    throw new AppError({
      code: "FILE_NOT_FOUND",
      message: `File does not exist at path: ${filePath}`,
      status: 404,
    });
  }

  const { ffprobe } = getBinaryPaths();
  const args = [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size,format_name:stream=index,codec_type,codec_name,width,height",
    "-of",
    "json",
    filePath,
  ];

  let stdout: string;
  try {
    const res = await runProcess(ffprobe, args, 30_000);
    stdout = res.stdout;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new AppError({
      code: "INVALID_VIDEO_FORMAT",
      message: `Could not parse media container: ${message}`,
      status: 400,
    });
  }

  let probeData: {
    format?: { duration?: string; size?: string; format_name?: string };
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
    }>;
  };

  try {
    probeData = JSON.parse(stdout);
  } catch {
    throw new AppError({
      code: "INVALID_VIDEO_FORMAT",
      message: "ffprobe returned invalid JSON output",
      status: 400,
    });
  }

  const duration = parseFloat(probeData.format?.duration || "0");
  const sizeBytes = parseInt(probeData.format?.size || "0", 10);
  const formatName = probeData.format?.format_name || "unknown";

  const videoStream = probeData.streams?.find((s) => s.codec_type === "video");
  const audioStream = probeData.streams?.find((s) => s.codec_type === "audio");

  if (!videoStream) {
    throw new AppError({
      code: "NO_VIDEO_STREAM",
      message: "Supplied media does not contain a video stream",
      status: 400,
    });
  }

  const codec = (videoStream.codec_name || "").toLowerCase();
  const width = videoStream.width || 0;
  const height = videoStream.height || 0;

  if (duration <= 0 || isNaN(duration)) {
    throw new AppError({
      code: "CORRUPT_VIDEO_DURATION",
      message: "Video duration is zero or invalid",
      status: 400,
    });
  }

  if (duration > maxDurationSeconds) {
    throw new AppError({
      code: "DURATION_EXCEEDED",
      message: `Video duration (${Math.round(duration)}s) exceeds maximum allowed (${maxDurationSeconds}s)`,
      status: 400,
    });
  }

  if (!ALLOWED_VIDEO_CODECS.has(codec)) {
    throw new AppError({
      code: "UNSUPPORTED_CODEC",
      message: `Video codec '${codec}' is not supported. Supported codecs: ${Array.from(ALLOWED_VIDEO_CODECS).join(", ")}`,
      status: 400,
    });
  }

  if (width > 3840 || height > 2160) {
    throw new AppError({
      code: "RESOLUTION_EXCEEDED",
      message: `Resolution (${width}x${height}) exceeds 4K cap (3840x2160)`,
      status: 400,
    });
  }

  return {
    duration,
    sizeBytes,
    formatName,
    videoStream: { codec, width, height },
    hasAudio: Boolean(audioStream),
  };
}

/**
 * Extracts EBU R128 loudness metrics and scene cut timestamps from video.
 */
export async function analyzeAudioAndScenes(
  filePath: string,
  hasAudio: boolean,
): Promise<{ loudnessPoints: LoudnessPoint[]; sceneTimestamps: number[] }> {
  const { ffmpeg } = getBinaryPaths();
  let loudnessPoints: LoudnessPoint[] = [];
  let sceneTimestamps: number[] = [];

  // Pass 1: Audio loudness (only if file has audio)
  if (hasAudio) {
    try {
      const audioArgs = [
        "-hide_banner",
        "-nostats",
        "-i",
        filePath,
        "-af",
        "ebur128",
        "-f",
        "null",
        "-",
      ];
      // ebur128 writes its log to stderr
      const res = await runProcess(ffmpeg, audioArgs, 90_000);
      loudnessPoints = parseEbur128Loudness(res.stderr);
    } catch {
      // Audio analysis failure is non-fatal: fallback to baseline
      loudnessPoints = [];
    }
  }

  // Pass 2: Visual scene cut detection (downscaled to 320:180 for 10x faster frame analysis)
  try {
    const sceneArgs = [
      "-hide_banner",
      "-nostats",
      "-i",
      filePath,
      "-filter_complex",
      "scale=320:180,select='gt(scene,0.3)',showinfo",
      "-f",
      "null",
      "-",
    ];
    const res = await runProcess(ffmpeg, sceneArgs, 90_000);
    sceneTimestamps = parseSceneChanges(res.stderr);
  } catch {
    // Scene analysis failure is non-fatal: fallback to baseline
    sceneTimestamps = [];
  }

  return { loudnessPoints, sceneTimestamps };
}

/**
 * Renders a vertical 9:16 clip (1080x1920) with blurred background fill
 * for 16:9 gameplay footage.
 */
export async function renderVerticalClip(
  options: RenderClipOptions,
): Promise<{ outputPath: string; sizeBytes: number }> {
  const { inputPath, outputPath, startTime, duration } = options;
  const { ffmpeg } = getBinaryPaths();

  // Create destination directory if needed
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Filter chain:
  // 1. Split video into background [bg] and foreground [fg]
  // 2. Background: downscale to 270:480, apply fast boxblur, then upscale to 1080:1920 (4x rendering speedup)
  // 3. Foreground: scale to fit within 1080:1920 maintaining aspect ratio
  // 4. Overlay centered foreground over blurred background
  const filterComplex = [
    "[0:v]split=2[bg][fg];",
    "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=6:2,scale=1080:1920[bgblur];",
    "[fg]scale=1080:1920:force_original_aspect_ratio=decrease[fgscaled];",
    "[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2",
  ].join("");

  const args = [
    "-y",
    "-ss",
    startTime.toFixed(3),
    "-t",
    duration.toFixed(3),
    "-i",
    inputPath,
    "-filter_complex",
    filterComplex,
    "-c:v",
    "libx264",
    "-crf",
    "23",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  ];

  await runProcess(ffmpeg, args, 180_000);

  if (!fs.existsSync(outputPath)) {
    throw new AppError({
      code: "CLIP_RENDER_FAILED",
      message: `Rendered output file missing at ${outputPath}`,
      status: 500,
    });
  }

  const stat = fs.statSync(outputPath);
  return { outputPath, sizeBytes: stat.size };
}

/**
 * Extracts a high-quality JPG thumbnail frame from video.
 */
export async function renderThumbnail(
  options: RenderThumbnailOptions,
): Promise<{ outputPath: string }> {
  const { inputPath, outputPath, timestamp } = options;
  const { ffmpeg } = getBinaryPaths();

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const args = [
    "-y",
    "-ss",
    timestamp.toFixed(3),
    "-i",
    inputPath,
    "-vframes",
    "1",
    "-q:v",
    "2",
    outputPath,
  ];

  await runProcess(ffmpeg, args, 30_000);

  if (!fs.existsSync(outputPath)) {
    throw new AppError({
      code: "THUMBNAIL_RENDER_FAILED",
      message: `Thumbnail output file missing at ${outputPath}`,
      status: 500,
    });
  }

  return { outputPath };
}

/**
 * Test fixture utility: generates a synthetic 16:9 MP4 test video
 * with testsrc2 and synthetic audio bursts for verifying the pipeline.
 */
export async function generateSyntheticTestVideo(options: {
  outputPath: string;
  durationSeconds?: number;
  burstTimestamps?: number[]; // Timestamps in seconds where audio bursts occur
}): Promise<string> {
  const { outputPath, durationSeconds = 60, burstTimestamps = [10, 30, 50] } = options;
  const { ffmpeg } = getBinaryPaths();

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Construct audio volume expression:
  // Base volume is -30dB (0.03), during bursts (duration 4s) volume is 1.0 (0dB)
  const burstConditions = burstTimestamps
    .map((ts) => `between(t,${ts},${ts + 4})`)
    .join("+");

  const volumeExpr = burstConditions.length > 0
    ? `if(${burstConditions}, 1.0, 0.03)`
    : "0.1";

  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `testsrc2=size=1920x1080:rate=30:duration=${durationSeconds}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=1000:duration=${durationSeconds}`,
    "-filter_complex",
    `[1:a]volume=eval=frame:volume='${volumeExpr}'[aout]`,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-c:a",
    "aac",
    outputPath,
  ];

  await runProcess(ffmpeg, args, 60_000);
  return outputPath;
}
