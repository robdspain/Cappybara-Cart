# 03 — Rendering & Art Bible
**Style:** Low-poly, bright, toon-shaded. No sprite imports. Polygon-only characters.

## Budgets
- Character: ≤2k tris (LOD1: 1.2k, LOD2: 600)
- Kart: ≤1.5k tris (LOD1: 900, LOD2: 450)
- Track: ≤60k tris total; props instanced

## Materials/Shaders
- Toon 1–2 bands, rim light
- Optional outline via inverted hull (scale 0.03)
- KTX2 textures; Draco-compressed glTF

## Animation
- Characters: idle, steer L/R (additive), hit react, victory
- Kart: wheel spin from velocity, drift pose (tilt + skid)

## VFX
- GPU particles: boost trails, skid smoke, missile trail
- Lightning flash limited <100 ms
