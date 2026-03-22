# Capybara Kart - Product Requirements Document

## Vision
Replicate the playability, game feel, and fun factor of **Super Mario Kart (SNES, 1992)** as a web-based 3D kart racer, starring a capybara protagonist. The game should feel immediately fun, accessible to casual players, yet reward skilled play with drifting, item strategy, and coin management.

---

## Reference: What Makes SNES Mario Kart Great

### Core Game Feel
- **Instant responsiveness**: Digital inputs feel crisp; karts react immediately
- **Easy to learn**: Accelerate + steer = fun within seconds
- **Hard to master**: Drift boosting, coin management, item timing separate good from great
- **Always competitive**: Rubber-banding items keep every race exciting until the end
- **Satisfying speed**: Sense of speed through FOV, camera shake, and visual feedback

### SNES Mario Kart Key Mechanics
1. **Coins increase top speed** (+8 per coin in SNES, max 10 coins)
2. **Drift/power-slide** with mini-turbo boost on release
3. **Items weighted by position** (1st gets bananas, last gets stars)
4. **AI rubber-banding** (trailing AI gets speed boost)
5. **Off-track penalties** (major speed loss on grass/dirt)
6. **Collision interactions** (kart-to-kart bumping, item hits cause spin-outs)
7. **3 laps per race** with Lakitu lap counter
8. **Speed classes**: 50cc, 100cc, 150cc

### SNES HUD Layout
- Lap counter (Lakitu sign)
- Coin counter (gold coin icon + number)
- Timer (top-right)
- Position indicator (large, prominent)
- Bottom half: minimap OR rear-view mirror
- NO speedometer (added in later games)

---

## Gap Analysis: Current State vs Target

### P0 - Critical (Blocks fun gameplay)
| Gap | Current | Target |
|-----|---------|--------|
| Item effects don't work | Items collected but shells/mushrooms/stars have no gameplay effect | All items must affect gameplay |
| Track is too simple | Basic oval ring | Need interesting turns, chicanes, varied width |
| Steering feels floaty | Physics-based with momentum | More responsive, SNES-like digital feel |
| No collision feedback | Karts pass through each other | Kart-to-kart bumping, item hit reactions |
| Race feels empty | Silent racing with no feedback | Speed lines, engine pitch, drift sparks |

### P1 - Important (Significantly improves experience)
| Gap | Current | Target |
|-----|---------|--------|
| AI too predictable | Follow waypoints at constant speed | Varying behavior, item usage, personality |
| HUD doesn't show key info | Basic display | Clear position, coins, item, lap with style |
| No Lakitu countdown | Plain text "3...2...1" | Animated countdown sequence |
| Minimap hard to read | Small overlay | Clear track shape with racer dots |
| Off-track not punishing enough | 0.95x speed | Visible slowdown + dirt particles |

### P2 - Polish (Makes it feel complete)
| Gap | Current | Target |
|-----|---------|--------|
| No engine sound variation | Silent | Engine pitch changes with speed |
| No visual speed feedback | Camera at fixed FOV | FOV widens at speed, motion blur |
| Trees/scenery basic | Simple cones | More variety, Mario Kart-style elements |
| No race results fanfare | Basic screen | Podium-style results with times |
| Capybara not distinctive enough | Brown blob with eyes | Expressive, charming, recognizable |

---

## 5-Loop Improvement Plan

### Loop 1: Core Gameplay Feel
**Goal**: Make driving feel crisp and fun like SNES Mario Kart
- Redesign track with actual turns (S-curves, hairpins, chicanes)
- Tighten steering response (more digital, less floaty)
- Add surface-type physics (grass = 0.6x speed, sand = 0.5x)
- Fix track boundary collision (bounce back, not just slow)
- Improve drift feel (hop animation, clearer charge feedback)

### Loop 2: Visual Polish & Effects
**Goal**: Make the game look alive and feel fast
- Add speed lines/particles at high speed
- Add tire smoke during drifts
- Add dust/grass particles when off-track
- Improve lighting with sun position and lens flare feel
- Add kart tilt during turns
- Camera shake on collisions/boosts

### Loop 3: Item System & Combat
**Goal**: Items should meaningfully affect races
- Implement mushroom boost (instant speed burst)
- Implement green shell (straight-line projectile, bounces off walls)
- Implement banana (drop behind, causes spin-out on contact)
- Implement star (temporary invincibility + speed boost)
- Add visual/audio feedback for item hits
- Proper spin-out animation and recovery

### Loop 4: AI Behavior & Race Dynamics
**Goal**: Races should feel competitive and exciting
- AI uses items strategically
- AI difficulty scales with speed class (50/100/150cc)
- Rubber-band AI speed (trailing AI gets gradual speed boost)
- AI varies racing lines (not all on same path)
- Position calculation accounts for actual track progress
- AI reacts to items (dodges bananas, blocks shells)

### Loop 5: HUD, Audio & Final Polish
**Goal**: Complete, polished racing experience
- Redesign HUD to SNES style (prominent position, coin counter, item box)
- Add engine sound that varies with speed
- Add countdown with animated visual
- Improve race results screen
- Add start boost mechanic (time accelerate with countdown)
- Final balance pass on speeds, items, AI difficulty

---

## Success Criteria
- [ ] A new player can start racing and have fun within 10 seconds
- [ ] Drifting feels rewarding and gives noticeable boost
- [ ] Items meaningfully change race outcomes
- [ ] AI opponents feel competitive but beatable
- [ ] The capybara character is charming and recognizable
- [ ] Races feel exciting from start to finish (no boring stretches)
- [ ] 50cc feels easy, 150cc feels challenging
- [ ] The game runs at 60fps in modern browsers

---

## Technical Constraints
- Web-only (React + Three.js/R3F)
- No external 3D model files (procedural geometry)
- No external audio files (Web Audio API procedural sounds)
- Must work without any backend/server
- Target: 60fps on mid-range hardware
