# 15 — TypeScript API Contracts
**Purpose:** Standardize data interfaces for systems.

- `Vec3 = [number, number, number]`
- `ItemType = SpeedBoost | HomingMissile | Banana | Shield | Lightning | TripleThrowables`
- `KartStats { accel_mps2, top_speed_mps, handling_coeff, boost_cap, mass_kg }`
- `CharacterDef { id, name, perk, meshUrl, lod }`
- `UpgradeLevels { engine:0-3, tires:0-3, turbo:0-3, armor:0-2 }`
- `PlayerProfile { coins, unlockedCharacters[], upgrades, stats, settings }`
- `TrackJSON { name, spline, checkpoints[], surfaces[], pads[], items[] }`
- `RaceConfig { laps, gridSize, points[] }`
- `DDAConfig { top_speed_pct, grip_pct, aggression_range }`
- `ItemWeightBands { "1-2":{}, "3-4":{}, "5-6":{}, "7-8":{} }`
