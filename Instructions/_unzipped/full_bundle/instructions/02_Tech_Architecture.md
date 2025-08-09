# 02 — Tech Architecture
**Stack:** TypeScript + Vite. Renderer: Three.js or Babylon.js. Physics: cannon-es (JS) or Ammo.js (WASM).

## Core Managers
- SceneMgr, InputMgr, PhysicsMgr, AudioMgr, UIMgr, SaveMgr, RNG, (NetMgr later)

## ECS (recommended)
- **Entities:** Kart, Character, TrackPiece, ItemBox, Projectile, Pickup, Obstacle, UIWidget
- **Components:** Transform, Mesh, RigidBody, Drive, Drift, ItemHolder, AIController, FX, AudioSource
- **Systems:** Render, Physics, Drive/Drift, Items, AI, Pickup/Spawn, Lap/Checkpoint, HUD

## Build Targets
- WebGL2 (ship), WebGPU (opt-in)
- PWA installable

## Performance Contract
- 16.6 ms/frame @ 60 FPS: Physics ≤3 ms, Render ≤9 ms, Scripts/AI ≤3 ms, Audio/UI ≤1.6 ms
