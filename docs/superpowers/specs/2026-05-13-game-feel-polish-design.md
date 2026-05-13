# Spec: Game Feel + Polish

**Date:** 2026-05-13
**Status:** Approved

---

## Overview

NODEFALL's core gameplay is solid but lacks sensory feedback. This spec adds sound design, visual polish, persistent shortcut labels, and game-loop feedback. Reference: server-survival's tight game feel with immediate feedback on every action.

---

## Layer 1 — Sound (howler.js installed, AudioManager is stub)

AudioManager stub lives at `src/systems/AudioManager.ts`. Wire it up. All files go in `public/audio/` (Vite static).

| Sound | Trigger | Notes |
|---|---|---|
| `firewall_fire.mp3` | Firewall shoots | Short zap |
| `encryption_fire.mp3` | Encryption Node fires | Soft hum |
| `overload_fire.mp3` | Overload Cannon fires | Heavy boom |
| `emp_fire.mp3` | EMP Tower fires | Electric burst |
| `ice_fire.mp3` | Ice Node fires | Shatter crack |
| `enemy_death.mp3` | Any enemy dies | Pop/explosion |
| `wave_start.mp3` | Wave begins | Alert tone |
| `boss_incoming.mp3` | Boss wave starts | Warning horn |
| `core_damage.mp3` | Enemy reaches core | Impact thud |
| `tower_place.mp3` | Tower placed | Construction click |
| `tower_sell.mp3` | Tower sold | Currency sound |
| `ui_hover.mp3` | Hover any button | Subtle tick |
| `ui_click.mp3` | Click any button | Click |

**AudioManager API:**
```typescript
class AudioManager {
  private howls: Map<string, Howl>;
  play(soundId: string): void;
  play3D(soundId: string, position: Vector3): void; // spatial audio
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}
```
- Spatial audio for tower fires and enemy deaths (Howl `spatial: true`, `position` set per entity)
- Mute state persisted to `localStorage`

---

## Layer 2 — Visual Polish

### Tower Placement Feedback
- Valid cell hover: green emissive pulse (opacity 0.2→0.5→0.2, 600ms loop)
- Invalid cell hover: red emissive pulse
- Range circle: fade in over 150ms on hover (not just on selection)
- Placement confirm: expanding ring animation from tower center (0→full range, 200ms, fades out)

### Tower Firing Animation
- Recoil: `scale 1.0→1.08→1.0` over 120ms on the tower mesh
- Muzzle flash: brief emissive spike (white), 80ms

### Projectile Trails
- Each projectile leaves a trail of 4 fading cylinder segments
- Ring buffer of recent positions per projectile
- Segments fade over 100ms

### Enemy Damage Feedback
- White flash on hit: 80ms (already implemented — keep)
- On kill: scale 1→0 over 120ms + particle burst (10→20 particles, existing system)
- Gold text: flies upward from kill position, fades over 800ms (existing Pools — improve trajectory arc)

### Screen Shake
- Camera offset only — NOT mesh offset (avoids physics corruption)
- Proportional: 3px normal hit, 8px boss hit, 12px core breach
- Duration: 150ms / 200ms / 300ms respectively
- Camera returns to origin via lerp

### Wave Banner
- Pulse animation on "3...2...1..." countdown (scale 1.0→1.05→1.0 each second)
- "WAVE COMPLETE" green border flash on HUD gold display, 500ms

### Tower Unlock Notification
- Top-center banner slides in, amber glow
- "NEW TOWER UNLOCKED: [Tower Name]"
- Stays 3 seconds, slides out quietly (non-interruptive)
- Triggered from `selectTowerType` when wave crosses unlock threshold

### Pause Dimming
- Game canvas: CSS `filter: brightness(0.6)` on `#game-container`
- All panels: `filter: saturate(0.3)` (desaturate)
- "PAUSED" text centered, pulsing opacity animation

### Persistent Shortcut Labels
Add keyboard shortcut badges to every interactive UI element. No hover required — always visible.

| Location | Label |
|---|---|
| InfoPanel Upgrade button | `Q` |
| InfoPanel Sell button | `E` |
| Speed button | `Space` |
| Pause button | `Space` |
| TowerPanel Firewall card | `1` |
| TowerPanel Encryption card | `2` |
| TowerPanel Overload card | `3` |
| TowerPanel EMP card | `4` |
| TowerPanel Ice card | `5` |

Implementation: add `<kbd>` elements styled as monospace key badges in each component. CSS: dark bg, subtle border, rounded, small font.

---

## Layer 3 — Game Loop Feedback

### Enemy HP Bar Improvements
- Smooth color interpolation: green → yellow → orange → red (not stepped)
- Boss HP bar: wire to actual boss HP (set `boss-hp-fill` width % from `KernelBoss.hp / KernelBoss.maxHp`)

### Gold Counter Animation
- Count-up/down to new value over 300ms (not instant jump)
- Brief golden glow on HUD gold display when gold increases

### Score Counter
- Count-up animation on wave complete

---

## Bug Fixes (Hidden in Polish Scope)

- **Boss HP bar not updating** — wire in `Game.loop()`: get boss reference, update `boss-hp-fill.style.width` each frame
- **DocsPanel ESC handler** — remove listener on close (currently leaks)

---

## Performance Constraints

- Particle cap: 200 total
- Trail buffer per projectile: 4 positions max
- No new DOM elements per frame (reuse Pools)
- Screen shake via camera offset only

---

## Deliverables

1. AudioManager wired with 14 sounds
2. Visual feedback on every player action
3. Screen shake proportional to impact
4. Tower unlock notification (fade-in, non-interruptive)
5. Pause dimming overlay
6. Boss HP bar live update
7. Smooth gold/score count animations
8. Persistent shortcut labels on all interactive elements