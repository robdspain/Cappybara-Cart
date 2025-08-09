# 11 — Performance & Optimizations
**Target:** 60 FPS desktop

## Budgets
- Physics ≤3 ms, Render ≤9 ms, Scripts/AI ≤3 ms, Audio/UI ≤1.6 ms

## Techniques
- Frustum + occlusion culling
- Instancing for props
- Dynamic res for split-screen
- Object pooling (projectiles/FX)
- KTX2 + Draco glTF
- LOD groups; static batching for track
