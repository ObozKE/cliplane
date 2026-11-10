/**
 * Highlight Scoring Engine for ClipLane Worker
 *
 * Evaluates audio energy bursts (EBU R128 momentary loudness) and visual
 * dynamics (scene cuts) over sliding windows to rank gameplay moments.
 *
 * Product Integrity Rule:
 * The score is strictly named "highlight score" (never "viral score").
 */

export interface LoudnessPoint {
  timestamp: number;
  momentaryLoudness: number; // in LUFS (e.g. -70 to 0)
}

export interface HighlightCandidate {
  startTime: number;
  endTime: number;
  duration: number;
  highlightScore: number; // 0.00 to 1.00
  burstTimestamp: number;
  avgLoudness: number;
  maxLoudness: number;
  sceneCutsCount: number;
}

export interface HighlightScoringOptions {
  duration: number;
  loudnessPoints?: LoudnessPoint[];
  sceneTimestamps?: number[];
  targetClipDuration?: number; // default 20s
  minClipDuration?: number; // default 15s
  maxClipDuration?: number; // default 30s
  clipCount?: number; // default 3
  preRollSeconds?: number; // default 2s
  stepSeconds?: number; // sliding step, default 1s
}

/**
 * Parses FFmpeg ebur128 output log to extract momentary loudness time points.
 * Expects lines matching: `t: <time> M: <lufs>`
 */
export function parseEbur128Loudness(log: string): LoudnessPoint[] {
  const points: LoudnessPoint[] = [];
  // Regex matching `t: 12.34 ... M: -21.5` or `t: 12.34 M: -inf` (compatible across FFmpeg versions)
  const regex = /t:\s*([\d.]+).*?\bM:\s*([-\d.]+|-\w+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(log)) !== null) {
    const rawTs = match[1] ?? "0";
    const timestamp = parseFloat(rawTs);
    const rawLoudness = match[2] ?? "-70";
    const momentaryLoudness =
      rawLoudness === "-inf" || isNaN(parseFloat(rawLoudness))
        ? -70
        : Math.max(-70, Math.min(0, parseFloat(rawLoudness)));

    if (!isNaN(timestamp)) {
      points.push({ timestamp, momentaryLoudness });
    }
  }

  // Sort by timestamp
  return points.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Parses FFmpeg scene detection showinfo logs to extract scene change timestamps.
 * Expects lines with: `pts_time:<time>`
 */
export function parseSceneChanges(log: string): number[] {
  const timestamps: number[] = [];
  // Regex matching showinfo pts_time
  const regex = /pts_time:\s*([\d.]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(log)) !== null) {
    const rawTs = match[1] ?? "0";
    const ts = parseFloat(rawTs);
    const lastTs = timestamps[timestamps.length - 1];
    if (!isNaN(ts) && (lastTs === undefined || ts - lastTs > 0.2)) {
      timestamps.push(ts);
    }
  }

  return timestamps.sort((a, b) => a - b);
}

/**
 * Calculates top non-overlapping highlight windows across the video duration.
 */
export function calculateHighlightWindows(options: HighlightScoringOptions): HighlightCandidate[] {
  const {
    duration,
    loudnessPoints = [],
    sceneTimestamps = [],
    targetClipDuration = 20,
    minClipDuration = 15,
    maxClipDuration = 30,
    clipCount = 3,
    preRollSeconds = 2,
    stepSeconds = 1,
  } = options;

  if (duration <= 0) {
    return [];
  }

  // If entire video is shorter than minClipDuration, return the whole video as 1 clip
  if (duration <= minClipDuration) {
    return [
      {
        startTime: 0,
        endTime: Math.round(duration * 100) / 100,
        duration: Math.round(duration * 100) / 100,
        highlightScore: 0.7,
        burstTimestamp: 0,
        avgLoudness: -24,
        maxLoudness: -18,
        sceneCutsCount: sceneTimestamps.length,
      },
    ];
  }

  const effectiveClipDuration = Math.min(
    maxClipDuration,
    Math.max(minClipDuration, Math.min(targetClipDuration, duration)),
  );

  // If no loudness points supplied, synthesize baseline points
  const points =
    loudnessPoints.length > 0
      ? loudnessPoints
      : [{ timestamp: 0, momentaryLoudness: -28 }, { timestamp: duration, momentaryLoudness: -28 }];

  // Compute baseline audio statistics
  const lufsValues = points.map((p) => p.momentaryLoudness);
  const minLufs = Math.min(...lufsValues, -70);
  const maxLufs = Math.max(...lufsValues, -14);
  const lufsRange = Math.max(1, maxLufs - minLufs);

  const candidates: HighlightCandidate[] = [];

  // Slide window across the video duration
  const lastPossibleStart = Math.max(0, duration - effectiveClipDuration);

  for (let rawStart = 0; rawStart <= lastPossibleStart; rawStart += stepSeconds) {
    const windowEnd = Math.min(duration, rawStart + effectiveClipDuration);
    const windowPoints = points.filter(
      (p) => p.timestamp >= rawStart && p.timestamp <= windowEnd,
    );

    let avgWindowLufs = -30;
    let maxWindowLufs = -30;
    let peakTimestamp = rawStart + effectiveClipDuration / 2;

    if (windowPoints.length > 0) {
      let sum = 0;
      for (const pt of windowPoints) {
        sum += pt.momentaryLoudness;
        if (pt.momentaryLoudness > maxWindowLufs) {
          maxWindowLufs = pt.momentaryLoudness;
          peakTimestamp = pt.timestamp;
        }
      }
      avgWindowLufs = sum / windowPoints.length;
    }

    // Audio energy burst score (normalized 0..1)
    const normalizedAvg = Math.max(0, Math.min(1, (avgWindowLufs - minLufs) / lufsRange));
    const normalizedPeak = Math.max(0, Math.min(1, (maxWindowLufs - minLufs) / lufsRange));
    const audioBurstScore = 0.6 * normalizedPeak + 0.4 * normalizedAvg;

    // Scene cut count & density
    const cutsInWindow = sceneTimestamps.filter(
      (ts) => ts >= rawStart && ts <= windowEnd,
    ).length;
    // Normalized scene density: 0 to ~0.5 cuts per second
    const density = cutsInWindow / effectiveClipDuration;
    const sceneScore = Math.max(0, Math.min(1, density / 0.5));

    // Combined Highlight Score: 65% audio burst dynamics, 35% visual scene cuts
    const combinedScore = 0.65 * audioBurstScore + 0.35 * sceneScore;
    const roundedScore = Math.round(combinedScore * 100) / 100;

    // Compute clip boundaries with 2s pre-roll before the peak burst
    let clipStart = Math.max(0, peakTimestamp - preRollSeconds);
    let clipEnd = clipStart + effectiveClipDuration;
    if (clipEnd > duration) {
      clipEnd = duration;
      clipStart = Math.max(0, clipEnd - effectiveClipDuration);
    }

    candidates.push({
      startTime: Math.round(clipStart * 100) / 100,
      endTime: Math.round(clipEnd * 100) / 100,
      duration: Math.round((clipEnd - clipStart) * 100) / 100,
      highlightScore: roundedScore,
      burstTimestamp: Math.round(peakTimestamp * 100) / 100,
      avgLoudness: Math.round(avgWindowLufs * 10) / 10,
      maxLoudness: Math.round(maxWindowLufs * 10) / 10,
      sceneCutsCount: cutsInWindow,
    });
  }

  // Sort candidates by highlightScore descending
  candidates.sort((a, b) => b.highlightScore - a.highlightScore);

  // Pick top N non-overlapping windows
  const selected: HighlightCandidate[] = [];

  for (const candidate of candidates) {
    if (selected.length >= clipCount) break;

    // Check overlap with already selected windows
    // Windows overlap if start of one is before end of another and vice-versa
    const overlaps = selected.some((sel) => {
      const maxStart = Math.max(sel.startTime, candidate.startTime);
      const minEnd = Math.min(sel.endTime, candidate.endTime);
      // Allow at most 2 seconds of margin overlap
      return maxStart < minEnd - 2;
    });

    if (!overlaps) {
      selected.push(candidate);
    }
  }

  // If we couldn't find enough non-overlapping windows (e.g. video is uniform),
  // fallback to evenly spaced windows
  if (selected.length < clipCount && duration > effectiveClipDuration) {
    const needed = clipCount - selected.length;
    const segmentSpan = (duration - effectiveClipDuration) / Math.max(1, needed + 1);

    for (let i = 1; i <= needed; i++) {
      const s = Math.round(i * segmentSpan * 100) / 100;
      const e = Math.round((s + effectiveClipDuration) * 100) / 100;

      const alreadyOverlaps = selected.some(
        (sel) => Math.max(sel.startTime, s) < Math.min(sel.endTime, e) - 2,
      );

      if (!alreadyOverlaps) {
        selected.push({
          startTime: s,
          endTime: e,
          duration: effectiveClipDuration,
          highlightScore: 0.5,
          burstTimestamp: s + effectiveClipDuration / 2,
          avgLoudness: -24,
          maxLoudness: -18,
          sceneCutsCount: 0,
        });
      }
    }
  }

  // Final sort by chronological startTime for natural presentation
  return selected.sort((a, b) => a.startTime - b.startTime);
}
