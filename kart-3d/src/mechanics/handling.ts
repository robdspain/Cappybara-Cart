import * as THREE from 'three'
import type { Tuning, SurfaceType } from './tuning'
import type { KartStats, DriftTuning, BoostTuning, SurfaceTuningMap } from './model'

export type DriveInputs = { throttle: number; steer: number; drift: number }

export function computeSurfaceMu(surface: SurfaceType, tuning: Tuning): number {
  if (surface === 'mud') return tuning.SURFACE_MU.mud
  if (surface === 'curb') return tuning.SURFACE_MU.curb
  if (surface === 'tarmac') return tuning.SURFACE_MU.tarmac
  return tuning.SURFACE_MU.ramp
}

export function applyHandling(
  body: any,
  driveVel: number,
  inputs: DriveInputs,
  surface: SurfaceType,
  envAccel: number,
  envTop: number,
  now: number,
  lightningUntil: number,
  tuning: Tuning,
) {
  const MASS = tuning.MASS
  const GRAV = tuning.GRAVITY

  // Orientation vectors from quaternion
  const q = body.quaternion
  const yaw = Math.atan2(q.y * q.w * 2, 1 - 2 * (q.y * q.y + q.z * q.z))
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))

  // Velocity decomposition
  const vel = new THREE.Vector3(body.velocity.x, 0, body.velocity.z)
  const vF = THREE.MathUtils.clamp(vel.dot(forward), -100, 100)
  let vLat = THREE.MathUtils.clamp(vel.dot(right), -100, 100)

  // Lateral damping to stabilize
  const vLatDamped = vLat * (1 - tuning.LATERAL_VEL_DAMP)
  const dvLat = vLatDamped - vLat
  body.velocity.x += right.x * dvLat
  body.velocity.z += right.z * dvLat
  vLat = vLatDamped

  // Force targets
  let top = tuning.BASE_TOP_SPEED * envTop
  if (lightningUntil > now) top *= 0.7
  const accelForce = MASS * tuning.ACCEL * envAccel
  const brakeForce = MASS * 18

  let Fx = 0
  let Fz = 0

  // Longitudinal
  if (inputs.throttle > 0) {
    const speedError = Math.max(0, top - Math.max(0, vF))
    const long = Math.min(accelForce * inputs.throttle, speedError * MASS)
    Fx += forward.x * long
    Fz += forward.z * long
  } else if (inputs.throttle < 0) {
    const long = brakeForce * (-inputs.throttle) * (1 + Math.abs(vF))
    Fx -= forward.x * long * Math.sign(vF || 1)
    Fz -= forward.z * long * Math.sign(vF || 1)
  }

  // Lateral grip
  const mu = computeSurfaceMu(surface, tuning)
  const baseGrip = tuning.BASE_GRIP
  const driftSlip = inputs.drift ? 0.3 : 0.0
  const surfaceGrip = surface === 'mud' ? 0.7 : surface === 'curb' ? 0.9 : 1.0
  const gripCoeff = baseGrip * surfaceGrip * (1 - driftSlip)
  const FlatMag = -vLat * gripCoeff * MASS
  Fx += right.x * FlatMag
  Fz += right.z * FlatMag

  // Traction circle
  const maxTraction = mu * MASS * GRAV
  const Fmag = Math.hypot(Fx, Fz)
  if (Fmag > maxTraction) {
    const scale = maxTraction / Fmag
    Fx *= scale
    Fz *= scale
  }
  body.applyForce({ x: Fx, y: 0, z: Fz } as any, body.position as any)

  // Steering torque
  const speedAbs = Math.abs(vF)
  const steerEff = THREE.MathUtils.clamp(1 - speedAbs / (top + 1e-3), tuning.MIN_STEER_EFF, 1)
  let steer = inputs.steer * steerEff * (lightningUntil > now ? 1.1 : 1.0)
  if (speedAbs < tuning.LOW_SPEED_ASSIST_ON) steer *= tuning.LOW_SPEED_ASSIST_GAIN
  const yawTorque = steer * MASS * 12 * tuning.BASE_HANDLING
  body.torque.y += yawTorque

  // Downforce & angular damping
  const downforce = 0.6 * speedAbs * speedAbs
  body.applyForce({ x: 0, y: -downforce, z: 0 } as any, body.position as any)
  body.angularDamping = tuning.ANGULAR_DAMPING

  // Clamp yaw rate
  const maxYaw = 2.2
  if (Math.abs(body.angularVelocity.y) > maxYaw) {
    body.angularVelocity.y = Math.sign(body.angularVelocity.y) * maxYaw
  }

  // Nudge velocity toward desired forward speed (from drive integrator)
  const desiredForwardSpeed = Math.max(0, Math.min(top, driveVel))
  const currentForwardSpeed = vF
  const deltaForward = desiredForwardSpeed - currentForwardSpeed
  body.velocity.x += forward.x * deltaForward
  body.velocity.z += forward.z * deltaForward
}

export function integrateKartRuntime(
  dt: number,
  rt: {
    pos: { x: number; y: number }
    yaw: number
    vel: { x: number; y: number }
    speed: number
    steer: number
    throttle: number
    brake: number
    drifting: boolean
    driftChargeS: number
    driftSlip: number
    boostTimerS: number
    boostSpeedAdd: number
    surface: SurfaceType
    stunnedS: number
    lastDriftReleaseS: number
  },
  stats: KartStats,
  drift: DriftTuning,
  boost: BoostTuning,
  surfaces: SurfaceTuningMap,
) {
  // Update boost timer decay
  if (rt.boostTimerS > 0) {
    rt.boostTimerS = Math.max(0, rt.boostTimerS - dt)
    const k = Math.exp(-dt / Math.max(0.001, boost.decayS))
    rt.boostSpeedAdd *= k
  } else {
    rt.boostSpeedAdd = 0
  }

  // Surface multipliers
  const s = surfaces[rt.surface]
  const accel = stats.accel_mps2 * (s?.accelMult ?? 1)
  const top = (stats.top_mps + rt.boostSpeedAdd) * (s?.maxSpeedMult ?? 1)
  const grip = (stats.grip) * (s?.gripMult ?? 1)

  // Drift slip interpolation
  const targetSlip = rt.drifting ? drift.slipMax : drift.slipMin
  rt.driftSlip += (targetSlip - rt.driftSlip) * Math.min(1, dt * 6)

  // Yaw integration (steer only influences angular accel externally via physics)
  // In this runtime integrator, we just compute desired yaw change fraction for visuals or AI.

  // Longitudinal speed integration (clamped by top speed)
  const desired = Math.min(top, Math.max(0, rt.speed + accel * rt.throttle * dt - stats.drag * rt.speed * dt))
  const dv = desired - rt.speed
  const forwardX = Math.sin(rt.yaw)
  const forwardZ = Math.cos(rt.yaw)
  rt.vel.x += forwardX * dv
  rt.vel.y += forwardZ * dv

  // Lateral damping based on grip and slip
  const rightX = Math.cos(rt.yaw)
  const rightZ = -Math.sin(rt.yaw)
  const vLat = rt.vel.x * rightX + rt.vel.y * rightZ
  const vLatDamped = vLat * (1 - Math.min(0.5, (1 - rt.driftSlip) * grip * 0.02))
  const dvLat = vLatDamped - vLat
  rt.vel.x += rightX * dvLat
  rt.vel.y += rightZ * dvLat

  // Position update
  rt.pos.x += rt.vel.x * dt
  rt.pos.y += rt.vel.y * dt
  rt.speed = Math.hypot(rt.vel.x, rt.vel.y)
}


