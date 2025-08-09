// Project TurboKart - Starter Types & Stubs (TypeScript)
// Drop into a Vite project (src/), then expand systems.
// Rendering: Three.js or Babylon.js (your choice). Physics: cannon-es recommended.

export type Vec3 = [number, number, number];

export enum ItemType {
  SpeedBoost = "SpeedBoost",
  HomingMissile = "HomingMissile",
  Banana = "Banana",
  Shield = "Shield",
  Lightning = "Lightning",
  TripleThrowables = "TripleThrowables",
}

export interface KartStats {
  accel_mps2: number;
  top_speed_mps: number;
  handling_coeff: number; // 0.85–1.15
  boost_cap: number;      // units
  mass_kg: number;        // 130–160
}

export interface CharacterPerk {
  accel_pct?: number;
  armor_pct?: number;
  handling_pct?: number;
  boost_cap_pct?: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  perk: CharacterPerk;
  meshUrl: string;   // glTF reference
  lod: { base: number; lod1: number; lod2: number };
}

export interface UpgradeLevels {
  engine: number; // 0-3
  tires: number;  // 0-3
  turbo: number;  // 0-3
  armor: number;  // 0-2
}

export interface PlayerProfile {
  profileId: string;
  coins: number;
  unlockedCharacters: string[];
  selectedCharacterId: string;
  upgrades: UpgradeLevels;
  stats: {
    races: number;
    wins: number;
    bestLaps: Record<string, number>;
  };
  settings: {
    a11y: { shake: boolean; cbMode: "off" | "protan" | "deutan" | "tritan" };
    input: "keyboard" | "gamepad";
  };
}

export interface TrackJSON {
  name: string;
  spline: Vec3[];
  checkpoints: { p: Vec3; w: number }[];
  surfaces: { type: "tarmac" | "mud" | "curb" | "ramp"; box: number[] }[];
  pads: { pos: Vec3; dir: Vec3 }[];
  items: { pos: Vec3 }[];
}

export interface RaceConfig {
  laps: number;
  gridSize: number;
  points: number[]; // [10,8,6,5,4,3,2,1]
}

export interface DDAConfig {
  top_speed_pct: [number, number]; // [-6, 6]
  grip_pct: [number, number];      // [-6, 6]
  aggression_range: [number, number];
}

export interface ItemWeights {
  [k in ItemType]?: number;
}
export interface ItemWeightBands {
  "1-2": ItemWeights;
  "3-4": ItemWeights;
  "5-6": ItemWeights;
  "7-8": ItemWeights;
}

// ---- Live-Tunable Data Examples ----
export const DEFAULT_RACE_CONFIG: RaceConfig = {
  laps: 3,
  gridSize: 8,
  points: [10,8,6,5,4,3,2,1],
};

export const DEFAULT_DDA: DDAConfig = {
  top_speed_pct: [-6, 6],
  grip_pct: [-6, 6],
  aggression_range: [0.3, 0.8],
};

export const DEFAULT_ITEM_BANDS: ItemWeightBands = {
  "1-2": { SpeedBoost:45, HomingMissile:5, Banana:25, Shield:20, Lightning:0, TripleThrowables:5 },
  "3-4": { SpeedBoost:30, HomingMissile:15, Banana:20, Shield:20, Lightning:5, TripleThrowables:10 },
  "5-6": { SpeedBoost:20, HomingMissile:25, Banana:15, Shield:15, Lightning:10, TripleThrowables:15 },
  "7-8": { SpeedBoost:10, HomingMissile:30, Banana:10, Shield:10, Lightning:20, TripleThrowables:20 },
};

// ---- ECS-like Interfaces ----
export interface Transform { pos: Vec3; rotY: number; }
export interface RigidBody { vel: Vec3; }
export interface Drive { drifting: boolean; driftCharge: number; }
export interface ItemHolder { current?: ItemType; lastLightningTime?: number; }
export interface AIController { state: "DriveLine"|"Overtake"|"Defend"|"Recover"|"UseItem"; aggression: number; topSpeedScale: number; gripScale: number; }
export interface KartEntity {
  id: string;
  transform: Transform;
  body: RigidBody;
  drive: Drive;
  stats: KartStats;
  items: ItemHolder;
  ai?: AIController;
  isPlayer: boolean;
  rank: number;
  lastCheckpoint: number;
}

// ---- Systems: Stubs you can flesh out ----
export function updateDrive(dt: number, kart: KartEntity, surface: "tarmac"|"mud"|"curb"|"ramp") {
  // throttle/steer from controller (player or AI) → set vel & yaw
  // drift logic: threshold, charge, mini-turbo grant on release
  // TODO: integrate with your input system and physics solver
}

export function rollItem(position: number, bands: ItemWeightBands, lastLightningMs: number = 0): ItemType {
  const band = position <= 2 ? bands["1-2"] : position <= 4 ? bands["3-4"] : position <= 6 ? bands["5-6"] : bands["7-8"];
  const now = Date.now();
  const weights: [ItemType, number][] = Object.entries(band).map(([k, v]) => [k as ItemType, v || 0]);
  // pity rule
  const cooldown = 20000;
  if (now - lastLightningMs < cooldown) {
    const i = weights.findIndex(w => w[0] === ItemType.Lightning);
    if (i >= 0) weights[i][1] = 0;
  }
  const total = weights.reduce((a, [,w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [it, w] of weights) {
    if ((r -= (w || 0)) <= 0) return it;
  }
  return ItemType.SpeedBoost;
}

export function countLap(kart: KartEntity, lastCheckpointIndex: number, finalCheckpointIndex: number): boolean {
  // Require passing final checkpoint before S/F to prevent cuts
  return kart.lastCheckpoint === finalCheckpointIndex;
}

export function applyDDA(ai: AIController, playerGapSec: number, playerCrashes: number, lapTimeDeltaSec: number) {
  // Adjust topSpeedScale, gripScale, and aggression in small increments
  // clamp within [-0.06, +0.06] scales for fairness
}
