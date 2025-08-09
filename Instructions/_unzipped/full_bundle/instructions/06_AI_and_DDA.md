# 06 — AI & Dynamic Difficulty (DDA)
**Paths:** Centerline spline + 2 overtake lines. Nodes carry ideal speed, drift flag, danger score.

## State Machine
DriveLine ↔ Overtake ↔ Defend ↔ Recover ↔ UseItem

## DDA Inputs (per lap split)
- Player position delta
- Avg speed diff
- Crash count
- Lap time delta

## DDA Adjustments (clamped)
- Top speed scale: ±6%
- Grip scale: ±6%
- Aggression: 0.3–0.8
- Item bias: shift 1 band
- Delay missile if target has Shield (≤1.5 s)
