export type Vec2 = { x: number; y: number } // XZ plane
export type SurfaceId = 'tarmac' | 'mud' | 'pad' | 'curb' | 'ramp'

export interface KartStats {
  accel_mps2: number
  top_mps: number
  handling: number
  mass_kg: number
  drag: number
  grip: number
  boostCap: number
}

export interface SurfaceTuning {
  accelMult: number
  gripMult: number
  maxSpeedMult: number
}

export interface DriftTuning {
  driftSteerGain: number
  slipMin: number
  slipMax: number
  miniTurboTiers: { holdS: number; boostS: number }[]
  releaseLockoutS: number
}

export interface BoostTuning {
  instantAddMps: number
  decayS: number
  stackLockoutS: number
}

export interface KartRuntime {
  pos: Vec2
  yaw: number
  vel: Vec2
  speed: number
  steer: number
  throttle: number
  brake: number
  drifting: boolean
  driftChargeS: number
  driftSlip: number
  boostTimerS: number
  boostSpeedAdd: number
  surface: SurfaceId
  stunnedS: number
  lastDriftReleaseS: number
}

export type SurfaceTuningMap = Record<SurfaceId, SurfaceTuning>


