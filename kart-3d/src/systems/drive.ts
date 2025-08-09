import type { KartStats } from '../core/types'

export type DriveState = {
  vel: number
  drifting: boolean
  driftCharge: number
  surface: 'tarmac' | 'pad' | 'mud' | 'curb' | 'ramp'
}

const DRIFT_THRESH = 0.4

export function surfaceAccel(surface: DriveState['surface']) {
  switch (surface) {
    case 'mud':
      return 0.75
    case 'curb':
      return 0.9
    case 'pad':
      return 1.2
    default:
      return 1.0
  }
}

export function surfaceGrip(surface: DriveState['surface']) {
  switch (surface) {
    case 'mud':
      return 0.7
    case 'curb':
      return 0.9
    case 'pad':
      return 1.1
    default:
      return 1.0
  }
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function updateDrive(
  dt: number,
  kart: DriveState & { stats: KartStats; dda: { topSpeedScale: number } },
  input: { throttle: number; steer: number; drift: number },
  integrate: (steer: number) => void,
  addSkidFX: () => void,
  applyMiniTurbo: () => void
) {
  const targetSpeed = kart.stats.topSpeed * kart.dda.topSpeedScale
  const accel = kart.stats.accel * surfaceAccel(kart.surface)
  kart.vel += accel * input.throttle * dt
  kart.vel = clamp(kart.vel, 0, targetSpeed)

  let steer = input.steer * kart.stats.handling * surfaceGrip(kart.surface)
  if (input.drift && Math.abs(input.steer) > DRIFT_THRESH) {
    kart.drifting = true
    kart.driftCharge += dt
    steer *= 1.25
    addSkidFX()
  } else if (kart.drifting) {
    applyMiniTurbo()
    kart.drifting = false
    kart.driftCharge = 0
  }
  integrate(steer)
}


