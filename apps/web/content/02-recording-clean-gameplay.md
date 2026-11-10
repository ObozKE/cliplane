---
title: "Recording Clean Gameplay: Audio & Video Setup"
slug: "recording-clean-gameplay"
order: 2
category: "Production & Setup"
readTime: 6
summary: "Configure OBS Studio and GeForce Experience for optimal quality: separate audio tracks, constant framerates, and bitrate sweet spots."
---

# Recording Clean Gameplay: Audio & Video Setup

Garbage in, garbage out. The cleanest clipping algorithm cannot rescue gameplay captured with low bitrates, desynced audio, or muffled microphones.

Setting up your capture software properly takes 10 minutes and permanently raises the production baseline of your content.

---

## 1. Recommended Capture Software

| Software | Best For | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **OBS Studio** (Recommended) | All PC setups | Multi-track audio, NVENC/AV1 support, customizable canvas | Higher initial learning curve |
| **NVIDIA GeForce Experience / ShadowPlay** | Fast PC capture | Zero configuration, low overhead hotkey buffer | Limited to single or dual audio tracks |
| **Console Built-in (PS5 / Xbox Series X)** | Console players | Native 4K/1080p capture directly on SSD | Requires USB flash drive export |

---

## 2. OBS Video Settings for Gameplay Clips

Open OBS Studio → **Settings**:

### A. Video Tab
- **Base (Canvas) Resolution:** Match your gaming monitor (e.g. `1920x1080` or `2560x1440`).
- **Output (Scaled) Resolution:** `1920x1080` (Standard 1080p).
- **Downscale Filter:** `Lanczos (Sharpened scaling, 36 samples)`.
- **Common FPS Values:** `60 FPS`. Do not record fast-action games at 30 FPS; motion blur will look stuttery on mobile screens.

### B. Output Tab → Output Mode: Advanced → Recording
- **Recording Format:** `mp4` or `mkv` (if using MKV, enable Remux to MP4 under *Advanced → Automatically remux to mp4*).
- **Video Encoder:**
  - NVIDIA: `NVIDIA NVENC H.264` (or `HEVC` / `AV1` on RTX 40-series).
  - AMD: `AMD HW H.264`.
  - Intel: `Intel QuickSync H.264`.
- **Rate Control:** **CQP (Constant Quantization Parameter)** for local recording.
  - *Do NOT use CBR (Constant Bitrate) for local recording.* CBR is for live streaming.
  - **CQ Level:** Set between `18` (virtually lossless, larger files) and `22` (sharp quality, manageable size). A setting of `20` is the sweet spot.
  - **Keyframe Interval:** `2 s`.

---

## 3. Audio Setup: The Multi-Track Secret

One of the biggest mistakes creators make is merging their game audio, microphone, and Discord call into a single audio track. If a teammate coughs or music plays over a clutch play, you cannot fix it later.

In OBS Studio:
1. Open the **Advanced Audio Properties** (gear icon in the Audio Mixer).
2. Assign sources to discrete tracks:
   - **Track 1:** Game Audio only.
   - **Track 2:** Microphone only.
   - **Track 3:** Discord / Voice Chat.
   - **Track 4:** Master Mix (all combined).
3. Under **Settings → Output → Recording**, check tracks **1, 2, and 4**.

> [!TIP]
> Recording game audio cleanly on Track 1 guarantees that highlight loudness spikes (gunfire, score sound effects) are never masked by someone talking over the game.

---

## 4. Microphones & Audio Levels

- **Level Balancing:** In the mixer, game sound should peak around `-12 dB` to `-15 dB`. Your voice should peak between `-6 dB` and `-3 dB`.
- **Noise Suppression:** Add a **RNNoise** filter on your microphone in OBS to strip keyboard clicks and fan hum.
- **In-Game Music Warning:** Turn off copyrighted in-game radio music in settings (games like GTA, Cyberpunk, and Fortnite have a "Streamer Friendly / Copyright Safe Music" toggle). This protects your future clips from automatic audio muting on platforms.
