## Gameplay Mechanics Ownership

This document defines scope, responsibilities, conventions, and an actionable backlog for gameplay mechanics across the project. It ensures consistent, high-quality driving, drifting, boost, collision, items, and AI behaviors that align with the product specs and user rules.

### Mandate and Scope
- Own the end-to-end design and implementation of gameplay: kart handling, drift/boost, collisions, surfaces, checkpoints/laps, items/power-ups, AI driving, difficulty/DDA, and balance.
- Guardrails: follow the spec in `Instructions/3d_cart_racing_specs.md`, uphold user rules (Typescript errors zero-tolerance, mobile responsiveness, security checks, no DB table references that don’t exist), and keep performance 60 FPS on modern browsers.
- Consolidate mechanics into a single authoritative implementation. Prototypes remain for experiments, not for shipping behavior.

### Codebase Areas of Ownership
- Primary TS ECS implementation (authoritative):
  - `kart-3d/src/systems/drive.ts` – acceleration, steering, drift charge, mini-turbo hooks, surface scaling
  - `kart-3d/src/physics/physics.ts` – physics world, kart collider, stepping, static geometry
  - `kart-3d/src/systems/item.ts` – item weighting and cooldown logic
  - `kart-3d/src/game/startMinimalGame.ts` – input mapping, main loop integration, drift → mini-turbo grant, laps/checkpoints, AI follow/steer
  - `kart-3d/src/core/types.ts` – stats and DDA scales
  - `kart-3d/src/core/store.ts` – game selections/state that influence mechanics

- Legacy/Prototype React Three Fiber implementation (for reference only):
  - `src/components/PlayerRacer.js`, `AIRacer.js`, `ItemSystem.js`, `Game3DCanvas.js`, `Game.js` and related
  - Use these to harvest ideas/UX, but do not treat them as the source of truth.

### Operating Principles
- Deterministic fixed update for mechanics; render loop only renders and reads state.
- Single source of truth for each mechanic in the `kart-3d` subtree; expose tunables via constants/config.
- Predictable inputs: normalize `throttle`, `steer`, `drift`, `useItem` to [-1..1] or 0/1 before applying.
- Surfaces modify accel/grip/top speed via `surfaceAccel`/`surfaceGrip` and boost scales.
- Drift charge thresholds map to mini-turbo durations; separate from full boost pads/power-up boosts.
- Collisions: light cart-to-cart slows and push, walls/obstacles can trigger 1–2 s spin-out and velocity dampening.
- Items: position-weighted probabilities with cooldown-based gating (e.g., Lightning pity timer).
- AI: look-ahead steering to near-future waypoint, drift when angle error is high, difficulty scales accel/top/handling.

### Spec Alignment (from 3.1/3.2 highlights)
- Drifting builds charge; releasing triggers boost. Visual feedback: skid/sparks.
- Boosts: 2–3 seconds, 1.5x speed multiplier (for pads/power-ups). Mini-turbos use shorter durations scaled by drift charge.
- Collisions: cart-to-cart minor slow/push; walls/obstacles spin-out 1–2 s.
- Laps/checkpoints: default 3 laps, checkpoints to prevent shortcuts and off-track reset.
- AI: 6–8 bots, use same mechanics, adaptive pathing.

### User Rules Integration
- Always fix TypeScript errors before refactors or commits.
- Test mobile responsiveness: input (touch controls), HUD layout, performance.
- Security checks: no unsafe eval/injection, sanitize URL and asset loads, avoid third-party remote code.
- No DB references to non-existent tables (currently none; keep it that way).

### Conventions and Tunables
- Input thresholds: `DRIFT_THRESH = 0.4` for initiating drift (keep configurable).
- Mini-turbo charge thresholds: initial: 0.5 s (S), 1.2 s (M), 2.0 s (L) with durations 0.25/0.5/0.9 s. Revisit for feel.
- Full boost (pads/power-ups): 1.5x top speed scale for 2.0–3.0 s (configurable).
- Surface multipliers (current): accel: mud 0.75, curb 0.9, pad 1.2; grip: mud 0.7, curb 0.9, pad 1.1.
- Mass/handling/topSpeed/accel sourced from `KartStats`; DDA scales in `DdaScales`.

### Testing Matrix (min viable, expand over time)
- Browsers: Chrome, Firefox, Edge, Safari.
- Devices: desktop (keyboard/gamepad), mobile/tablet (touch), mid-range hardware target.
- Scenarios: drift engage/release, mini-turbos, pad boosts, collisions (cart/cart, wall), checkpoints/laps, items (each type), AI difficulty (easy/med/hard), performance (60 FPS).

### Observed Gaps/Notes (initial scan)
- `kart-3d` drift/boost exists; full boost multiplier in `startMinimalGame.ts` is set to +30% (not 1.5x). Needs alignment and config.
- Multiple parallel implementations (`src/components` vs `kart-3d`). Need consolidation.
- Touch controls absent in `kart-3d` loop.
- Spin-out visuals/status exist minimally; need consistent spin-out window and immunity windows for fairness.

### Backlog (Prioritized)
1) Boost system alignment and config
   - Add boost config: multiplier 1.5x, duration range 2–3 s for pads/power-ups.
   - Separate mini-turbo durations from full boosts.
   - Expose as constants or `content` JSON for tuning.

2) Drift feel pass
   - Review `DRIFT_THRESH` and charge/duration mapping for responsiveness.
   - Add skid/particle callback integration point in `updateDrive`.

3) Collision and spin-out consistency
   - Implement consistent 1–2 s spin-out on wall/obstacle, slight slow/push on cart contact.
   - Add brief post-hit immunity and audiovisuals.

4) Checkpoints/off-track behavior
   - Ensure reset logic and anti-shortcut checkpoint ordering are enforced across tracks.
   - Add slow-zone friction when off-track.

5) Items and DDA
   - Keep `weights.json` driven probabilities; add spec items mapping and durations/effects.
   - Maintain Lightning cooldown (pity timer) and expand for other high-impact items.

6) AI Improvements
   - Look-ahead waypoint selection (k+N index), drift on large heading error, difficulty scaling.
   - Item usage rules/cooldowns.

7) Mobile/touch controls and HUD responsiveness
   - Touch joystick + buttons, responsive HUD layout, performance audit on mobile.

8) Tech debt and consolidation
   - Migrate mechanics from `src/components/*` into `kart-3d` or fully gate prototypes behind a dev flag.

### Mapping to Files/Work Items
- `kart-3d/src/game/startMinimalGame.ts`: parameterize full boost multiplier/duration; separate mini-turbo vs full boosts; ensure item-driven boosts use full boost settings.
- `kart-3d/src/systems/drive.ts`: keep drift logic and callbacks; wire skid FX; allow charge/duration tuning.
- `kart-3d/src/physics/physics.ts`: add collision categorization for spin-out vs minor contact.
- `kart-3d/src/systems/item.ts`: maintain weighted tables and cooldown gating; connect to boost/shield/lightning effects.
- `kart-3d/src/core/types.ts`: host config types for tunables.

### Definition of Done (per change)
- Behavior aligns with spec or an intentional deviation documented here.
- Zero TypeScript errors; no linter regressions.
- Tested on desktop (keyboard) and mobile (touch) where relevant; HUD remains usable.
- Performance at/near 60 FPS in minimal test race.

### Immediate Next Steps (execution plan)
- Add a boost config and wire full boost multiplier to 1.5x with 2.5 s default duration.
- Add a clear distinction between mini-turbo and full boost in the loop/state.
- Create a simple touch input module for `kart-3d` to unblock mobile checks.

Appendix A: References
- Spec: `Instructions/3d_cart_racing_specs.md`
- Systems: `kart-3d/src/systems/drive.ts`, `kart-3d/src/game/startMinimalGame.ts`, `kart-3d/src/physics/physics.ts`, `kart-3d/src/systems/item.ts`

