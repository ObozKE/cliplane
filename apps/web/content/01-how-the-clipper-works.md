---
title: "How the Clipper Works: Audio Loudness & Scene Detection"
slug: "how-the-clipper-works"
order: 1
category: "Technology & Pipeline"
readTime: 4
summary: "Understand the deterministic FFmpeg pipeline behind ClipLane: EBU R128 loudness bursts, scene cut thresholds, and 9:16 vertical formatting."
---

# How the Clipper Works: Audio Loudness & Scene Detection

ClipLane does not use black-box "viral AI" or make speculative promises about internet algorithms. Instead, it runs a deterministic, physics-based signal processing pipeline powered by industry-standard open-source tools: **FFmpeg** and **EBU R128**.

Understanding how this pipeline works helps you record footage that extracts the highest-quality highlight moments.

---

## 1. Input Media Validation (`ffprobe`)

When you upload gameplay footage or provide a direct video URL:
1. **Container & Stream Analysis:** `ffprobe` validates that the file is an authentic media container with readable audio and video streams.
2. **Codec Inspection:** Codecs like H.264 (AVC) and H.265 (HEVC) with AAC or PCM audio are accepted. Corrupted streams or unsupported formats are rejected upfront with transparent error codes.
3. **Boundary Verification:** Files must meet maximum duration constraints (e.g., up to 2 hours) and safe resolution caps.

---

## 2. Audio Loudness Burst Detection (EBU R128)

Action in games—shootouts, explosions, clutch revives, high-speed vehicle impacts, team callouts—invariably manifests as sudden peaks in audio energy.

ClipLane passes the audio stream through an **EBU R128 momentary loudness filter** (`-af ebur128`):
- Loudness is measured in **LUFS** (Loudness Units relative to Full Scale) over sliding 400ms integration windows.
- The pipeline establishes an audio loudness baseline across the full video.
- Moments where loudness spikes significantly above the median baseline are registered as high-energy audio burst candidates.

---

## 3. Scene-Change Boundary Analysis (`gt(scene, 0.3)`)

Audio spikes alone can produce false positives (such as prolonged in-game background music). To verify visual engagement, the pipeline conducts visual scene detection:
- FFmpeg evaluates consecutive video frames: `select='gt(scene,0.3)',showinfo`.
- Any transition exceeding a 30% visual change vector (camera angle cuts, rapid movement, eliminations, scoreboard flashes) is captured with millisecond-precision timestamps.
- Clusters of scene changes indicate high mechanical activity or rapid camera movement.

---

## 4. The Highlight Windowing Algorithm

The pipeline merges the audio and visual signal vectors:
1. **Highlight Score Computation:** Each potential window receives a normalized score between `0.00` and `1.00` (0% to 100%) based on weighted burst amplitude and scene transition frequency.
2. **Pre-roll Buffer:** To ensure context is preserved, every candidate window includes a **2.0-second pre-roll** buffer. You never get a clip that starts at the moment of an elimination; you see the setup leading up to it.
3. **Duration Constraints:** Clips are bounded strictly between **15 and 45 seconds**. Moments shorter than 15 seconds lack context; moments longer than 45 seconds lose viewer pacing.
4. **Non-Overlapping Deduping:** The pipeline ranks the highest-scoring windows and strips any overlapping ranges to ensure every delivered clip is distinct.

---

## 5. Rendering: 9:16 Vertical Fill

Landscape gameplay (16:9, 1920x1080) looks terrible when cropped into a narrow 9:16 slit because HUD elements, crosshairs, and minimaps get cut off.

ClipLane renders a dual-layer composite with FFmpeg:
- **Background Layer:** The source video is scaled to cover 1080x1920 and blurred with a Gaussian blur filter (`gblur=sigma=20:steps=2`), filling the vertical frame with matched ambient lighting and colors.
- **Foreground Layer:** The crisp original 16:9 gameplay sits uncropped and centered at native aspect ratio (`scale=1080:608`).
- **Encoding:** Rendered with H.264 at CRF 23 with AAC stereo audio and `+faststart` atom placement for instantaneous mobile playback.

---

## Key Takeaway for Creators

Because the clipper looks for audio intensity and rapid visual changes:
- Keep in-game sound effects (gunfire, engines, voice chat) clean and distinct.
- Avoid drowning your gameplay in constant, loud external music before clipping.
