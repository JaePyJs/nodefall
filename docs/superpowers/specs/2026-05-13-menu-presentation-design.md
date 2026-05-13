# Spec: NODEFALL — Menu Redesign + Presentation System + Game Feel Polish

**Date:** 2026-05-13
**Status:** Approved

---

## Part 1: Menu Redesign — Command Center

### Overview
Transform the sparse main menu into a visually rich "System Command Center" home UI with interactive elements and ambient game atmosphere.

### Design Direction
- **Style**: Cyberpunk command terminal — dark bg, cyan primary, grid lines, scanline texture
- **Mood**: Active system dashboard, not static menu — things pulse, count, and animate
- **Layout**: Full-viewport grid with distinct zones

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Ambient grid background with slow pulse animation]    │
│  ┌──────────┐  ┌─────────────────────┐  ┌───────────┐ │
│  │  LOGO    │  │   STATS DASHBOARD   │  │  TOWER    │ │
│  │  NODEFALL│  │   Wave: 12/20       │  │  SHOWCASE │ │
│  │  + status│  │   Score: 4,250     │  │  (progress│ │
│  │          │  │   High: 8,100       │  │   bars)   │ │
│  ├──────────┤  ├─────────────────────┤  ├───────────┤ │
│  │SETTINGS  │  │   ENEMIES STATS     │  │PRESENTA-  │ │
│  │[toggles] │  │   Kills: 342        │  │TION MODE  │ │
│  │          │  │   Bosses: 4         │  │[slideshow]│ │
│  └──────────┘  └─────────────────────┘  └───────────┘ │
│              ┌─────────────────────────┐              │
│              │    START  MANUAL  DOCS  │              │
│              └─────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Ambient Background
- CSS grid pattern with subtle cyan lines
- Slow pulse animation on the grid (opacity 0.05 → 0.15, 4s loop)
- No performance impact — pure CSS

#### 2. Logo Zone (top-left)
- "NODEFALL" in large glitch-style text (use existing `.glitch` class or enhance)
- Subtitle: "NETWORK DEFENSE SIMULATOR v1.0"
- Status indicator: green dot + "SYSTEM ONLINE"

#### 3. Stats Dashboard (center-top)
Two sub-panels:

**Core Stats Panel:**
| Stat | Display |
|------|---------|
| Current Wave | `12 / 20` |
| Score | `4,250` (animated count-up on menu open) |
| High Score | `8,100` (loaded from localStorage) |

**Enemy Stats Panel:**
| Stat | Display |
|------|---------|
| Enemies Killed | `342` |
| Bosses Defeated | `4` |
| Credits Earned | `12,400g` |

All numbers animate from 0 → current value on menu open (800ms, ease-out). High score persists via `localStorage`.

#### 4. Tower Showcase (top-right)
- Shows all 5 tower types as locked/unlocked cards
- Locked cards: dark, greyed out, show "Unlocks Wave X"
- Unlocked cards: full color, glow border
- Progress bar at top: "3/5 TOWERS UNLOCKED"
- Tower cards show: name, icon, cost, key binding (1-5)

#### 5. Settings Panel (bottom-left)
Toggle switches for:
- **Sound FX** — `localStorage` persisted, calls `audio.setMuted()`
- **Music** — placeholder (future)
- **Particles** — toggle particle effects on/off
- **Fullscreen** — calls `toggleFullscreen()`
- **Auto-start waves** — boolean

Each setting: label + toggle switch (CSS, no library).

#### 6. Presentation Mode Button (bottom-right)
- Button: "PRESENTATION MODE" with projector icon (📊 or SVG)
- Click: Opens DocsPanel in **slideshow mode**
- Slideshow mode: full-screen, arrow keys or click to advance/prev slide, ESC to exit

#### 7. Action Buttons (bottom-center)
Three main buttons in a row:
| Button | Label | Action |
|--------|-------|--------|
| Primary | `INITIALIZE DEFENSE` | Start game (existing) |
| Secondary | `SYSTEM MANUAL` | Opens manual modal (existing) |
| Tertiary | `DOCUMENTATION` | Opens DocsPanel (existing) |

All buttons have hover glow + scale animation.

### Interaction Details
- **Menu open animation**: Panels fade in staggered (100ms delay each), numbers count up
- **Hover states**: All interactive elements glow on hover
- **Click feedback**: Brief scale-down (0.95) on button click
- **Settings toggles**: Smooth slide animation for on/off state

---

## Part 2: Presentation Mode (DocsPanel Slideshow)

### Overview
DocsPanel gains a "Presentation Mode" that transforms it into a full-screen slideshow viewer.

### Activation
- Button in menu: "PRESENTATION MODE" opens a **dedicated full-screen overlay**
- Separate from DocsPanel — a standalone slideshow viewer
- Not part of the game docs panel

### Slideshow UI
```
┌──────────────────────────────────────────────────────┐
│ NODEFALL — Slide 3 of 12          [X] [⬜] [⬛]         │
├──────────────────────────────────────────────────────┤
│                                                      │
│           SLIDE CONTENT AREA                         │
│     (same content as DocsPanel, larger typography)   │
│                                                      │
├──────────────────────────────────────────────────────┤
│  ◀ PREV     [●●●●○○○○○○○]     NEXT ▶               │
└──────────────────────────────────────────────────────┘
```

### Navigation
- **Arrow keys**: Left/Right to navigate slides
- **ESC**: Exit presentation mode
- **Progress dots**: Clickable, jump to any slide  
- **Thumbnail sidebar**: Shows all slides as small previews, click to jump
- **Slide counter**: "3 of 12" in top-right

### Thumbnail Sidebar
- Left side: vertical strip of slide thumbnails (100px wide)
- Current slide highlighted with cyan border
- Click thumbnail → jump to that slide
- Collapsible (toggle button to show/hide thumbnails)
- Thumbnails are mini-renders of each slide content

### Slide Content
Parses DocsPanel content into slides. Each `<section>` becomes one slide. Speaker notes extracted from a hidden `<notes>` tag within each section (optional).

### Styling
- Slides use `font-size: 1.5rem` (larger than DocsPanel's normal view)
- Max width per slide: 900px centered
- Background: same dark theme as menu
- Slide transitions: fade in/out (200ms)

### Implementation
- Add `presentationMode: boolean` state to DocsPanel IIFE
- Add `openPresentationMode()` and `closePresentationMode()` functions
- Slice DOCS_HTML by `<section>` tags into array of slide strings
- Navigation state: `currentSlide: number`
- Render current slide into `#docs-panel-content` with presentation CSS classes
- Prev/Next buttons + progress dots appended in presentation mode

---

## Part 3: Remaining Game Feel Polish

These complete the spec from `2026-05-13-game-feel-polish-design.md`.

### 3.1 Wave Banner Pulse Animation
On "3...2...1..." countdown, each second pulse: `scale 1.0 → 1.05 → 1.0` (200ms).
- Implementation: CSS `@keyframes bannerPulse` applied to countdown numbers

### 3.2 Gold/Score Count-Up Animation
When gold or score changes:
- Animate from old value → new value over 300ms
- Brief golden glow on gold display (CSS box-shadow pulse)
- Use `requestAnimationFrame` for smooth interpolation

### 3.3 Tower Unlock Notification Banner
When wave crosses a tower unlock threshold:
- Top-center amber banner slides in from top
- Text: "⚠ NEW TOWER UNLOCKED: [Tower Name]"
- Amber glow pulse animation
- Stays 3 seconds, slides out
- Non-interruptive (game continues)

### 3.4 Pause Dimming Overlay
When game is paused:
- `#game-container` gets `filter: brightness(0.6)`
- All panels get `filter: saturate(0.3)`
- "PAUSED" text centered, pulsing opacity (0.5 → 1.0 → 0.5, 1s loop)
- CSS-only implementation

---

## Implementation Order

1. **Menu HTML/CSS restructure** — new layout grid in `index.html`
2. **Menu.ts enhancements** — new panels, animations
3. **Settings toggles** — sound, particles, fullscreen
4. **Stats persistence** — localStorage for high score
5. **Tower showcase panel** — locked/unlocked cards
6. **Presentation mode** — slideshow for DocsPanel
7. **Game feel polish** — banner pulse, count-up, unlock notification, pause dimming

---

## Files to Modify
- `index.html` — menu layout restructuring
- `src/ui/Menu.ts` — all new menu logic
- `src/style.css` — menu styling, animations, presentation mode CSS
- `src/ui/DocsPanel.ts` — add presentation mode
- `src/systems/GameState.ts` — high score tracking
- `src/systems/AudioManager.ts` — mute toggle
- `src/core/Game.ts` — fullscreen toggle, settings integration
