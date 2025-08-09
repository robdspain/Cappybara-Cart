export type SurfaceType = 'tarmac' | 'curb' | 'mud' | 'ramp'

export type Tuning = {
  DRIFT_THRESH: number
  ACCEL: number
  BASE_TOP_SPEED: number
  BASE_HANDLING: number
  MASS: number
  GRAVITY: number
  BASE_GRIP: number
  MIN_STEER_EFF: number
  LOW_SPEED_ASSIST_ON: number
  LOW_SPEED_ASSIST_OFF: number
  LOW_SPEED_ASSIST_GAIN: number
  LINEAR_DAMPING: number
  ANGULAR_DAMPING: number
  LATERAL_VEL_DAMP: number
  EDGE_WALL_THICKNESS: number
  EDGE_WALL_HEIGHT: number
  SURFACE_MU: Record<SurfaceType, number>
}

export const TUNING: Tuning = {
  DRIFT_THRESH: 0.4,
  ACCEL: 14,
  BASE_TOP_SPEED: 30,
  BASE_HANDLING: 1.0,
  MASS: 150,
  GRAVITY: 9.82,
  BASE_GRIP: 45,
  MIN_STEER_EFF: 0.25,
  LOW_SPEED_ASSIST_ON: 1.5,
  LOW_SPEED_ASSIST_OFF: 3.0,
  LOW_SPEED_ASSIST_GAIN: 1.3,
  LINEAR_DAMPING: 0.2,
  ANGULAR_DAMPING: 0.6,
  LATERAL_VEL_DAMP: 0.12,
  EDGE_WALL_THICKNESS: 0.7,
  EDGE_WALL_HEIGHT: 1.0,
  SURFACE_MU: { tarmac: 1.3, curb: 0.9, mud: 0.6, ramp: 1.0 },
}


