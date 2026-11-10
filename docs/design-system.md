# ClipLane Design System Specification
**Visual Archetype:** Extracted directly from [Carefront](https://carefront.webflow.io/).
**Product:** ClipLane (`cliplane.tech`) — Precision vertical gameplay highlight generator.

---

## 1. Color Palette (Exact Carefront Hex Values)

### Primary & Neutral Paper Tones (Warm Editorial Base)
- **Background Paper (`--bg-paper`):** `#f3f1ec` (Signature warm, tactile editorial surface)
- **Background Raised (`--bg-raised`):** `#fbfaf7` (Used on active surfaces, elevated inputs)
- **Background Card (`--bg-card`):** `#f7f5f0` (Used on content containers and feature cards)
- **Background Subtle (`--bg-subtle`):** `#ece8e0` (Subtle dividers, table row hover)
- **Line Paper / Borders (`--line-paper`):** `#d6d1c6` (Clean hairline border)
- **Line Strong (`--line-strong`):** `#e2ddd3`
- **Text Primary (`--text-primary`):** `#1d1e22` (Deep near-black charcoal, high contrast)
- **Text Muted (`--text-muted`):** `#656669` (Secondary labels, explanatory descriptions)

### Brand Accent (Electric Cobalt)
- **Accent Default (`--accent-default`):** `#2f6bff` (Signature vivid interactive cobalt)
- **Accent Mid / Hover (`--accent-mid`):** `#275de8` (Hover state for primary actions)
- **Accent Dark / Active (`--accent-dark`):** `#1e4fd1` (Pressed / focused state)
- **Accent Text (`--accent-text`):** `#2f6bff`
- **Accent On Surface (`--accent-on`):** `#ffffff` (Text on cobalt buttons)

### Contrast Dark Panels (Command Center / Media Showcase)
- **Panel Background (`--bg-panel`):** `#1d1f26` (Dark slate-charcoal for player cards & queue monitors)
- **Panel Raised (`--bg-panel-raised`):** `#2e323c` (Inner widgets within dark panels)
- **Panel Deep (`--bg-panel-deep`):** `#17191e` (Terminal / code / video display backdrops)
- **Panel Text (`--text-panel`):** `#e3e4e7` (High-contrast text on dark surfaces)
- **Panel Text Muted (`--text-panel-muted`):** `#a2a5ab`
- **Panel Text Subtle (`--text-panel-subtle`):** `#6d7078`
- **Panel Border / Line (`--line-panel`):** `#3f434c`

### Status & Feedback
- **Status Alert / Error (`--status-alert`):** `#c4453a` (Takedown flags, validation errors, quota exceeded)
- **Status Success (`--status-success`):** `#16a34a` (Complete jobs, verified payments)
- **Status Warning (`--status-warning`):** `#d97706` (Free lane wait status, holding queue)

---

## 2. Typography

Carefront uses a refined editorial pairing:
- **Primary Sans:** `"Schibsted Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Body text: `15px` (`line-height: 1.5`, `font-weight: 400`)
  - Subheadings & UI Elements: `13px` - `16px` (`font-weight: 500`)
- **Display Serif:** `"Brygada 1918", Georgia, serif`
  - Hero Display (H1): `56px` (`line-height: 1.1`, `letter-spacing: -0.02em`)
  - Section Headings (H2): `32px` (`line-height: 1.2`, `letter-spacing: -0.01em`)
  - Card Titles (H3): `24px` (`line-height: 1.25`)
  - Feature Accents (H4): `20px`

---

## 3. Radii, Spacing & Shadows

### Border Radius Scale
- **Sharp / Micro (`rounded-xs`):** `2px` (Buttons in Carefront standard)
- **Small (`rounded-sm`):** `4px` (Inputs, badge pills, chips)
- **Card / Block (`rounded-md`):** `6px` to `8px` (Dropdown menus, auth cards)
- **Panel Container (`rounded-xl`):** `16px` (Large platform panels, video grid wrappers)

### Spacing Scale
- `0px`, `10px`, `12px`, `16px`, `20px`, `24px`, `32px`, `36px`, `48px`, `64px`, `96px`, `128px`

### Shadows
- **Card Subtle:** `0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(214, 209, 198, 0.6)`
- **Dropdown / Nav Mobile:** `0 24px 40px rgba(0, 0, 0, 0.08)`
- **Elevated Modal:** `0 20px 48px -12px rgba(29, 30, 34, 0.18)`

---

## 4. Components & Interactive Patterns

### Buttons
- **Primary (`button`):** `#2f6bff` background, `#ffffff` text, `border-radius: 2px`, `padding: 11px 18px`, `font-size: 14px`, `font-weight: 500`. Hover: `#275de8`.
- **Secondary (`button.is-secondary`):** `#e6e2da` background, `#1d1e22` text. Hover: `#ece8e0`.
- **Outline (`button.is-outline`):** `1px solid #d6d1c6`, `#fbfaf7` background, `#1d1e22` text.
- **Dark (`button.is-dark`):** `#1d1f26` background, `#e3e4e7` text.

### Navigation Header
- Height: `56px` (Desktop)
- Surface: `#f3f1ec` background with subtle blur, `border-bottom: 1px solid #d6d1c6`, sticky at `top: 0`, `z-index: 50`.
- Brand Mark: Minimal geometric badge + `Brygada 1918` serif wordmark.

### Dark Platform Panels (`.platform_panel`)
- Background: `#1d1f26`
- Text: `#e3e4e7`
- Radius: `16px`
- Border: `1px solid #3f434c`
- Used for: Live queue visualization, video player review, waveform highlight inspection.

---

## 5. Motion (Framer Motion)
- **Default Transition:** `transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }`
- **Entrance Stagger:** `staggerChildren: 0.08`
- **Respects `prefers-reduced-motion`:** all animations fallback to immediate opacity transitions when system preference is set.
