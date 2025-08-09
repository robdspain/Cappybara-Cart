import * as THREE from 'three'
import Stats from 'stats.js'
import { createWorld, defineComponent, defineQuery, defineSystem, Types, addComponent, addEntity } from 'bitecs'
import type { IWorld } from 'bitecs'
import { createPhysicsWorld, addGround, createKartBody, stepWorld, addStaticBox } from '../physics/physics'
import trackData from '../content/tracks/Sunny.json'
import { rollItem } from '../systems/item'
import { useAppStore } from '../core/store'

// Components
const Transform = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
  yaw: Types.f32,
})

const Drive = defineComponent({
  vel: Types.f32,
  drifting: Types.ui8,
  driftCharge: Types.f32,
})

const InputComp = defineComponent({
  throttle: Types.f32,
  steer: Types.f32,
  drift: Types.ui8,
  useItem: Types.ui8,
})

// Tuning constants (no magic numbers)
const TUNING = {
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
  SURFACE_MU: { tarmac: 1.3, curb: 0.9, mud: 0.6 } as Record<'tarmac'|'curb'|'mud'|'ramp', number>,
}

// Simple input manager
function createInput() {
  const state = { throttle: 0, steer: 0, drift: 0, useItem: 0 }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') state.throttle = 1
    if (e.code === 'KeyS' || e.code === 'ArrowDown') state.throttle = -1
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') state.steer = -1
    if (e.code === 'KeyD' || e.code === 'ArrowRight') state.steer = 1
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.drift = 1
    if (e.code === 'Space') state.useItem = 1
  }
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') if (state.throttle === 1) state.throttle = 0
    if (e.code === 'KeyS' || e.code === 'ArrowDown') if (state.throttle === -1) state.throttle = 0
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') if (state.steer === -1) state.steer = 0
    if (e.code === 'KeyD' || e.code === 'ArrowRight') if (state.steer === 1) state.steer = 0
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.drift = 0
    if (e.code === 'Space') state.useItem = 0
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  // Gamepad: poll standard-mapped controller
  let gpRaf = 0
  function pollGamepad() {
    const pads = navigator.getGamepads?.() || []
    const gp = pads.find(p => p && p.connected)
    if (gp) {
      const lsx = gp.axes?.[0] ?? 0
      const rt = gp.buttons?.[7]?.value ?? 0
      const lt = gp.buttons?.[6]?.value ?? 0
      state.steer = Math.abs(lsx) > 0.1 ? Math.max(-1, Math.min(1, lsx)) : 0
      if (rt > 0.15) state.throttle = 1
      else if (lt > 0.15) state.throttle = -1
      else state.throttle = 0
      state.drift = gp.buttons?.[1]?.pressed ? 1 : 0
      state.useItem = gp.buttons?.[0]?.pressed ? 1 : 0
    }
    gpRaf = requestAnimationFrame(pollGamepad)
  }
  window.addEventListener('gamepadconnected', () => {
    if (!gpRaf) gpRaf = requestAnimationFrame(pollGamepad)
  })
  window.addEventListener('gamepaddisconnected', () => {
    if (gpRaf) cancelAnimationFrame(gpRaf)
    gpRaf = 0
  })
  if (navigator.getGamepads?.().some(p => p && p.connected)) gpRaf = requestAnimationFrame(pollGamepad)

  // Touch overlay (only on touch-capable)
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.inset = '0'
  overlay.style.pointerEvents = 'none'
  overlay.style.zIndex = '1000'

  const joy = document.createElement('div')
  Object.assign(joy.style, { position: 'absolute', left: '24px', bottom: '24px', width: '120px', height: '120px', borderRadius: '60px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'auto' } as CSSStyleDeclaration)
  const knob = document.createElement('div')
  Object.assign(knob.style, { position: 'absolute', left: '40px', top: '40px', width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.35)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' } as CSSStyleDeclaration)
  joy.appendChild(knob)

  const btnDrift = document.createElement('button')
  btnDrift.textContent = 'Drift'
  Object.assign(btnDrift.style, { position: 'absolute', right: '24px', bottom: '90px', width: '96px', height: '96px', borderRadius: '48px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '16px', pointerEvents: 'auto' } as CSSStyleDeclaration)

  const btnItem = document.createElement('button')
  btnItem.textContent = 'Item'
  Object.assign(btnItem.style, { position: 'absolute', right: '24px', bottom: '24px', width: '96px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '16px', pointerEvents: 'auto' } as CSSStyleDeclaration)

  overlay.appendChild(joy)
  overlay.appendChild(btnDrift)
  overlay.appendChild(btnItem)

  let joyActive = false
  let joyStart: { x: number; y: number } | null = null
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    const rect = joy.getBoundingClientRect()
    if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
      joyActive = true
      joyStart = { x: t.clientX, y: t.clientY }
      knob.style.transition = 'none'
    }
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!joyActive || !joyStart) return
    const t = e.touches[0]
    const dx = t.clientX - joyStart.x
    const dy = t.clientY - joyStart.y
    const maxR = 50
    const mag = Math.hypot(dx, dy)
    const clamped = mag > maxR ? maxR / mag : 1
    const nx = dx * clamped
    const ny = dy * clamped
    knob.style.left = `${40 + nx}px`
    knob.style.top = `${40 + ny}px`
    state.steer = Math.max(-1, Math.min(1, nx / maxR))
    const v = -ny / maxR
    state.throttle = v > 0.15 ? 1 : v < -0.15 ? -1 : 0
  }
  const onTouchEnd = () => {
    joyActive = false
    joyStart = null
    knob.style.transition = 'left 120ms ease, top 120ms ease'
    knob.style.left = '40px'
    knob.style.top = '40px'
    state.steer = 0
    state.throttle = 0
  }
  joy.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  btnDrift.addEventListener('touchstart', () => { state.drift = 1 }, { passive: true })
  btnDrift.addEventListener('touchend', () => { state.drift = 0 }, { passive: true })
  btnItem.addEventListener('touchstart', () => { state.useItem = 1 }, { passive: true })
  btnItem.addEventListener('touchend', () => { state.useItem = 0 }, { passive: true })
  if ('ontouchstart' in window) document.body.appendChild(overlay)

  return {
    get: () => ({ ...state }),
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (gpRaf) cancelAnimationFrame(gpRaf)
      joy.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      overlay.remove()
    },
  }
}

// Minimal systems
const queryDrive = defineQuery([Transform, Drive, InputComp])

function createDriveSystem(
  speedScaleRef: { topSpeedScale: number },
  grantMiniTurbo: (seconds: number) => void
) {
  const ACCEL = TUNING.ACCEL
  const BASE_TOP_SPEED = TUNING.BASE_TOP_SPEED
  const HANDLING = TUNING.BASE_HANDLING
  const DRIFT_THRESH = TUNING.DRIFT_THRESH
  return defineSystem((world: IWorld, dt: number) => {
    const entities = queryDrive(world)
    for (let i = 0; i < entities.length; i += 1) {
      const eid = entities[i]
      const throttle = InputComp.throttle[eid]
      const steer = InputComp.steer[eid]
      let vel = Drive.vel[eid]
      vel += ACCEL * throttle * dt
      if (vel < 0) vel = 0
      const topSpeed = BASE_TOP_SPEED * (speedScaleRef.topSpeedScale || 1)
      if (vel > topSpeed) vel = topSpeed
      Drive.vel[eid] = vel

      let yawSteer = steer * HANDLING
      if (InputComp.drift[eid] && Math.abs(steer) > DRIFT_THRESH) {
        Drive.drifting[eid] = 1
        Drive.driftCharge[eid] += dt
        yawSteer *= 1.25
      } else if (Drive.drifting[eid]) {
        // release drift: grant mini turbo by charge thresholds
        const c = Drive.driftCharge[eid]
        if (c >= 2.0) grantMiniTurbo(0.9)
        else if (c >= 1.2) grantMiniTurbo(0.5)
        else if (c >= 0.5) grantMiniTurbo(0.25)
        Drive.drifting[eid] = 0
        Drive.driftCharge[eid] = 0
      }

      // Yaw is driven by physics; do not integrate here
    }
    return world
  })
}

function createRenderSystem(meshes: Map<number, THREE.Object3D>) {
  const query = defineQuery([Transform])
  return defineSystem((world: IWorld) => {
    const entities = query(world)
    for (let i = 0; i < entities.length; i += 1) {
      const eid = entities[i]
      const obj = meshes.get(eid)
      if (!obj) continue
      obj.position.set(Transform.x[eid], Transform.y[eid], Transform.z[eid])
      obj.rotation.y = Transform.yaw[eid]
    }
    return world
  })
}

export function startMinimalGame(canvas: HTMLCanvasElement) {
  const stats = new Stats()
  stats.showPanel(0)
  document.body.appendChild(stats.dom)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)
  scene.fog = new THREE.Fog(0x87ceeb, 30, 140)

  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
  camera.position.set(0, 6, 12)
  camera.lookAt(0, 0, 0)

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0)
  hemi.position.set(0, 20, 0)
  scene.add(hemi)

  const dir = new THREE.DirectionalLight(0xffffff, 0.6)
  dir.position.set(10, 12, 8)
  dir.castShadow = true
  dir.shadow.mapSize.set(1024, 1024)
  dir.shadow.camera.near = 1
  dir.shadow.camera.far = 60
  ;(dir.shadow.camera as THREE.OrthographicCamera).left = -20
  ;(dir.shadow.camera as THREE.OrthographicCamera).right = 20
  ;(dir.shadow.camera as THREE.OrthographicCamera).top = 20
  ;(dir.shadow.camera as THREE.OrthographicCamera).bottom = -20
  scene.add(dir)

  // Ground and clear paved track (tarmac ribbon)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x2d6a4f })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Detailed low‑poly kart + capybara rider
  const kartGroup = new THREE.Group()
  kartGroup.position.y = 0.0

  // Chassis
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.6, metalness: 0.1 })
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.8 })
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 })
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0x444400, emissiveIntensity: 0.5 })
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x330000, emissiveIntensity: 0.6 })

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 2.4), chassisMat)
  chassis.position.y = 0.55
  chassis.castShadow = true
  kartGroup.add(chassis)

  // Nose + bumper
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.6), chassisMat)
  nose.position.set(0, 0.6, 1.35)
  kartGroup.add(nose)
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.2), metalMat)
  bumper.position.set(0, 0.45, 1.6)
  kartGroup.add(bumper)

  // Fenders
  const fenderFL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.4), trimMat)
  fenderFL.position.set(0.8, 0.55, 0.9)
  const fenderFR = fenderFL.clone(); fenderFR.position.x = -0.8
  const fenderRL = fenderFL.clone(); fenderRL.position.set(0.8, 0.52, -0.9)
  const fenderRR = fenderFL.clone(); fenderRR.position.set(-0.8, 0.52, -0.9)
  kartGroup.add(fenderFL, fenderFR, fenderRL, fenderRR)

  // Seat
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.8), trimMat)
  seatBase.position.set(0, 0.72, -0.25)
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.15), trimMat)
  seatBack.position.set(0, 0.95, -0.65)
  kartGroup.add(seatBase, seatBack)

  // Steering wheel
  const steeringPivot = new THREE.Group()
  steeringPivot.position.set(0, 0.9, 0.2)
  const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), trimMat)
  steeringWheel.rotation.x = Math.PI / 2
  steeringPivot.add(steeringWheel)
  kartGroup.add(steeringPivot)

  // Exhausts
  const ex1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), metalMat)
  ex1.rotation.z = Math.PI / 2
  ex1.position.set(0.6, 0.55, -1.3)
  const ex2 = ex1.clone(); ex2.position.x = -0.6
  kartGroup.add(ex1, ex2)

  // Lights
  const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), lightMat); hl1.position.set(0.45, 0.6, 1.55)
  const hl2 = hl1.clone(); hl2.position.x = -0.45
  const tl1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), brakeMat); tl1.position.set(0.45, 0.6, -1.55)
  const tl2 = tl1.clone(); tl2.position.x = -0.45
  kartGroup.add(hl1, hl2, tl1, tl2)

  // Wheels (front with steer pivots)
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 })
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.4, metalness: 0.6 })
  function makeWheelMesh() {
    const g = new THREE.Group()
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 14), tireMat)
    tire.rotation.z = Math.PI / 2
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 8), rimMat)
    rim.rotation.z = Math.PI / 2
    g.add(tire, rim)
    return g
  }
  const pivotFL = new THREE.Group(); pivotFL.position.set(0.8, 0.35, 1.0)
  const pivotFR = new THREE.Group(); pivotFR.position.set(-0.8, 0.35, 1.0)
  const wFL = makeWheelMesh(); const wFR = makeWheelMesh();
  pivotFL.add(wFL); pivotFR.add(wFR)
  const wRL = makeWheelMesh(); wRL.position.set(0.8, 0.35, -1.0)
  const wRR = makeWheelMesh(); wRR.position.set(-0.8, 0.35, -1.0)
  kartGroup.add(pivotFL, pivotFR, wRL, wRR)

  // Simple spoiler
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.3), chassisMat)
  spoiler.position.set(0, 0.95, -1.2)
  kartGroup.add(spoiler)

  // Capybara rider (low‑poly)
  const capyGroup = new THREE.Group()
  capyGroup.position.set(0, 0.92, -0.35)
  const furMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.9 })
  const darkFurMat = new THREE.MeshStandardMaterial({ color: 0x6b4e33, roughness: 0.9 })
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.1 })

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), furMat); torso.scale.set(1.2, 0.9, 1.6)
  torso.position.y = 0.0
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), furMat); head.position.set(0, 0.18, 0.25)
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), darkFurMat); snout.position.set(0, 0.12, 0.38)
  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), darkFurMat); earL.position.set(0.12, 0.28, 0.18)
  const earR = earL.clone(); earR.position.x = -0.12
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), eyeMat); eyeL.position.set(0.08, 0.16, 0.32)
  const eyeR = eyeL.clone(); eyeR.position.x = -0.08
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 6), furMat); armL.position.set(0.22, -0.05, 0.05); armL.rotation.z = Math.PI / 6
  const armR = armL.clone(); armR.position.x = -0.22; armR.rotation.z = -Math.PI / 6
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 6), furMat); legL.position.set(0.14, -0.24, -0.2)
  const legR = legL.clone(); legR.position.x = -0.14
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), darkFurMat); tail.position.set(0, -0.05, -0.4)
  capyGroup.add(torso, head, snout, earL, earR, eyeL, eyeR, armL, armR, legL, legR, tail)
  kartGroup.add(capyGroup)

  // Animation baselines
  const baseHeadY = head.position.y
  const baseArmLRotZ = armL.rotation.z
  const baseArmRRotZ = armR.rotation.z
  let animTime = 0

  scene.add(kartGroup)
  // Start the kart centered on the track start
  kartGroup.position.set(0, 0.0, 0)
  // Enable shadows on kart pieces
  kartGroup.traverse((o) => {
    o.castShadow = true
  })

  // HUD root and sections
  const hudRoot = document.createElement('div')
  hudRoot.style.position = 'fixed'
  hudRoot.style.inset = '0'
  hudRoot.style.pointerEvents = 'none'
  hudRoot.style.zIndex = '10'
  document.body.appendChild(hudRoot)

  // Speedometer (bottom-left)
  const hudSpeed = document.createElement('div')
  hudSpeed.style.position = 'absolute'
  hudSpeed.style.left = '12px'
  hudSpeed.style.bottom = '12px'
  hudSpeed.style.padding = '8px 10px'
  hudSpeed.style.background = 'rgba(0,0,0,0.35)'
  hudSpeed.style.color = '#fff'
  hudSpeed.style.font = '14px/1.2 system-ui, sans-serif'
  hudSpeed.style.borderRadius = '8px'
  hudRoot.appendChild(hudSpeed)

  // Lap and position (top-center)
  const hudTop = document.createElement('div')
  hudTop.style.position = 'absolute'
  hudTop.style.top = '10px'
  hudTop.style.left = '50%'
  hudTop.style.transform = 'translateX(-50%)'
  hudTop.style.padding = '6px 10px'
  hudTop.style.background = 'rgba(0,0,0,0.35)'
  hudTop.style.color = '#fff'
  hudTop.style.font = '16px/1.2 system-ui, sans-serif'
  hudTop.style.borderRadius = '8px'
  hudRoot.appendChild(hudTop)

  // Power-up icon (bottom-right)
  const hudItem = document.createElement('div')
  hudItem.style.position = 'absolute'
  hudItem.style.right = '12px'
  hudItem.style.bottom = '12px'
  hudItem.style.width = '56px'
  hudItem.style.height = '56px'
  hudItem.style.borderRadius = '12px'
  hudItem.style.display = 'flex'
  hudItem.style.alignItems = 'center'
  hudItem.style.justifyContent = 'center'
  hudItem.style.background = 'rgba(0,0,0,0.35)'
  hudItem.style.color = '#fff'
  hudItem.style.font = '12px system-ui, sans-serif'
  hudItem.style.border = '1px solid rgba(255,255,255,0.25)'
  hudRoot.appendChild(hudItem)

  // Mini-map (bottom-center)
  const miniWrap = document.createElement('div')
  miniWrap.style.position = 'absolute'
  miniWrap.style.left = '50%'
  miniWrap.style.bottom = '8px'
  miniWrap.style.transform = 'translateX(-50%)'
  miniWrap.style.background = 'rgba(0,0,0,0.35)'
  miniWrap.style.padding = '6px'
  miniWrap.style.borderRadius = '10px'
  const mini = document.createElement('canvas')
  mini.width = 200
  mini.height = 120
  mini.style.display = 'block'
  miniWrap.appendChild(mini)
  hudRoot.appendChild(miniWrap)
  
  // Controls overlay
  const controls = document.createElement('div')
  controls.style.position = 'fixed'
  controls.style.right = '12px'
  controls.style.bottom = '12px'
  controls.style.padding = '10px 12px'
  controls.style.background = 'rgba(0,0,0,0.5)'
  controls.style.color = '#fff'
  controls.style.font = '12px/1.3 system-ui, sans-serif'
  controls.style.borderRadius = '8px'
  controls.style.pointerEvents = 'none'
  controls.textContent = 'Controls: W/S throttle, A/D steer, Shift drift, Space item, H hide/show'
  document.body.appendChild(controls)
  let controlsVisible = true
  const controlsKeyHandler = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'h') {
      controlsVisible = !controlsVisible
      controls.style.display = controlsVisible ? 'block' : 'none'
    }
  }
  window.addEventListener('keydown', controlsKeyHandler)

  // Pause overlay
  let paused = false
  let pauseOverlay: HTMLDivElement | null = null
  let showingOptions = false
  function ensurePauseOverlay() {
    if (pauseOverlay) return pauseOverlay
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.inset = '0'
    div.style.background = 'rgba(0,0,0,0.55)'
    div.style.display = 'flex'
    div.style.alignItems = 'center'
    div.style.justifyContent = 'center'
    div.style.color = '#fff'
    div.style.zIndex = '1000'
    div.style.font = '16px system-ui, sans-serif'
    div.style.pointerEvents = 'auto'
    document.body.appendChild(div)
    pauseOverlay = div
    return div
  }
  function hidePauseOverlay() {
    if (pauseOverlay) {
      pauseOverlay.remove()
      pauseOverlay = null
    }
  }
  function buildPauseMenu() {
    const overlay = ensurePauseOverlay()
    overlay.innerHTML = ''
    const panel = document.createElement('div')
    panel.style.background = 'rgba(20,20,24,0.95)'
    panel.style.padding = '20px 24px'
    panel.style.borderRadius = '12px'
    panel.style.minWidth = '320px'
    panel.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5)'
    const title = document.createElement('div')
    title.textContent = showingOptions ? 'Options' : 'Paused'
    title.style.fontSize = '20px'
    title.style.marginBottom = '12px'
    panel.appendChild(title)
    if (!showingOptions) {
      const btns = [
        { label: 'Resume', onClick: () => { paused = false; hidePauseOverlay() } },
        { label: 'Restart', onClick: () => { resetForNextRace(); paused = false; hidePauseOverlay() } },
        { label: 'Options', onClick: () => { showingOptions = true; buildPauseMenu() } },
        { label: 'Quit to Menu', onClick: () => { useAppStore.getState().setScreen('menu') } },
      ] as const
      for (const b of btns) {
        const el = document.createElement('button')
        el.textContent = b.label
        el.style.display = 'block'
        el.style.width = '100%'
        el.style.padding = '10px 12px'
        el.style.margin = '8px 0'
        el.style.borderRadius = '8px'
        el.style.border = '0'
        el.style.cursor = 'pointer'
        el.onclick = b.onClick
        panel.appendChild(el)
      }
    } else {
      // Simple Options: volume, input method, graphics quality
      const st = useAppStore.getState()
      const row = (label: string, child: HTMLElement) => {
        const r = document.createElement('div')
        r.style.display = 'grid'
        r.style.gridTemplateColumns = '1fr auto'
        r.style.alignItems = 'center'
        r.style.gap = '12px'
        r.style.margin = '8px 0'
        const l = document.createElement('div')
        l.textContent = label
        r.appendChild(l)
        r.appendChild(child)
        return r
      }
      // Volume (0-100)
      const vol = document.createElement('input') as HTMLInputElement
      vol.type = 'range'; vol.min = '0'; vol.max = '100'
      const currentVol = (st.profile.settings as any).volume ?? 100
      vol.value = String(currentVol)
      vol.oninput = () => {
        const v = Number(vol.value)
        const p = { ...st.profile, settings: { ...st.profile.settings, volume: v } as any }
        useAppStore.getState().updateProfile(p)
      }
      panel.appendChild(row('Volume', vol))
      // Input method
      const sel = document.createElement('select')
      for (const opt of ['keyboard','gamepad'] as const) {
        const o = document.createElement('option')
        o.value = opt; o.text = opt
        if (st.profile.settings.input === opt) o.selected = true
        sel.appendChild(o)
      }
      sel.onchange = () => {
        const p = { ...st.profile, settings: { ...st.profile.settings, input: sel.value as any } }
        useAppStore.getState().updateProfile(p)
      }
      panel.appendChild(row('Input', sel))
      // Graphics quality (affects pixel ratio)
      const gsel = document.createElement('select')
      for (const opt of ['low','medium','high'] as const) {
        const o = document.createElement('option')
        o.value = opt; o.text = opt
        gsel.appendChild(o)
      }
      gsel.value = 'high'
      gsel.onchange = () => {
        const v = gsel.value
        const ratio = v === 'low' ? 0.75 : v === 'medium' ? 1 : Math.min(window.devicePixelRatio, 2)
        renderer.setPixelRatio(ratio)
      }
      panel.appendChild(row('Graphics', gsel))

      const back = document.createElement('button')
      back.textContent = 'Back'
      back.style.display = 'block'
      back.style.width = '100%'
      back.style.padding = '10px 12px'
      back.style.marginTop = '12px'
      back.style.borderRadius = '8px'
      back.style.border = '0'
      back.style.cursor = 'pointer'
      back.onclick = () => { showingOptions = false; buildPauseMenu() }
      panel.appendChild(back)
    }
    overlay.appendChild(panel)
  }
  const pauseKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      paused = !paused
      showingOptions = false
      if (paused) buildPauseMenu(); else hidePauseOverlay()
    }
  }
  window.addEventListener('keydown', pauseKeyHandler)

  // ECS world
  const world: IWorld = createWorld()
  const meshes = new Map<number, THREE.Object3D>()
  const player = addEntity(world)
  addComponent(world, Transform, player)
  addComponent(world, Drive, player)
  addComponent(world, InputComp, player)
  Transform.x[player] = 0
  Transform.y[player] = 0
  Transform.z[player] = 0
  Transform.yaw[player] = 0
  Drive.vel[player] = 0
  meshes.set(player, kartGroup)

  // Input wiring into component each frame
  const input = createInput()

  // Systems
  const speedScaleRef = { topSpeedScale: 1 }
  const driveSystem = createDriveSystem(speedScaleRef, (seconds: number) => {
    boostTime = Math.max(boostTime, seconds)
  })
  const renderSystem = createRenderSystem(meshes)

  // Track and gameplay elements
  type Vec3 = [number, number, number]
  type TrackData = {
    name: string
    spline: Vec3[]
    checkpoints: { p: Vec3; w: number }[]
    surfaces: { type: 'tarmac' | 'mud' | 'curb' | 'ramp'; box: number[] }[]
    pads: { pos: Vec3; dir: Vec3 }[]
    items: { pos: Vec3 }[]
    barriers?: { center: Vec3; half: Vec3; yaw: number }[]
  }

  const checkpointMeshes: THREE.Object3D[] = []
  let checkpoints: { p: Vec3; w: number }[] = []
  let trackPoints: THREE.Vector3[] = []
  const itemBoxes: { mesh: THREE.Mesh; pos: THREE.Vector3; active: boolean; respawnAt: number }[] = []
  const surfaces: { type: 'tarmac' | 'mud' | 'curb' | 'ramp'; min: THREE.Vector3; max: THREE.Vector3; mesh?: THREE.Mesh }[] = []
  const pads: { pos: THREE.Vector3; mesh?: THREE.Mesh }[] = []
  // defaults (not currently used directly)
  const lapsTarget = 3
  let boostTime = 0
  let lastSurfaceType: 'tarmac' | 'mud' | 'curb' | 'ramp' = 'tarmac'
  let currentTrackName = 'Track'

  // Load player profile and compute kart stats
  const { profile, selectedCharacterId } = useAppStore.getState()
  const up = profile.upgrades
  const char = selectedCharacterId
  const perkAccel = char === 'sprinter' ? 1.03 : 1.0
  const perkHandling = char === 'slick' ? 1.04 : 1.0
  const perkBoost = char === 'turbo' ? 1.08 : 1.0
  const BASE_TOP = 30 + (up.engine || 0) * 1.5
  const BASE_ACCEL = 12 * perkAccel
  const BASE_HANDLING = (1.0 + (up.tires || 0) * 0.08) * perkHandling
  const BOOST_SCALE = 1 + (up.turbo || 0) * 0.1 * perkBoost
  // const MASS_BASE = 150

  async function loadTrackData() {
    const data = trackData as unknown as TrackData
    currentTrackName = data.name || 'Track'
    // Track ribbon mesh from centerline
    trackPoints = data.spline.map((v) => new THREE.Vector3(v[0], v[1] + 0.02, v[2]))
    const width = 8
    const lefts: THREE.Vector3[] = []
    const rights: THREE.Vector3[] = []
    for (let i = 0; i < trackPoints.length; i++) {
      const p = trackPoints[i]
      const n = trackPoints[(i + 1) % trackPoints.length]
      const dirv = new THREE.Vector3().subVectors(n, p).setY(0).normalize()
      const normal = new THREE.Vector3(-dirv.z, 0, dirv.x)
      lefts.push(new THREE.Vector3().addVectors(p, normal.clone().multiplyScalar(width * 0.5)))
      rights.push(new THREE.Vector3().addVectors(p, normal.clone().multiplyScalar(-width * 0.5)))
    }
    const positions: number[] = []
    const indices: number[] = []
    for (let i = 0; i < trackPoints.length; i++) {
      const l = lefts[i]
      const r = rights[i]
      positions.push(l.x, 0.05, l.z, r.x, 0.05, r.z)
    }
    for (let i = 0; i < trackPoints.length; i++) {
      const a = i * 2
      const b = ((i + 1) % trackPoints.length) * 2
      indices.push(a, a + 1, b)
      indices.push(a + 1, b + 1, b)
    }
    const roadGeom = new THREE.BufferGeometry()
    roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    roadGeom.setIndex(indices)
    roadGeom.computeVertexNormals()
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 1.0, metalness: 0.0 })
    const road = new THREE.Mesh(roadGeom, roadMat)
    road.receiveShadow = true
    scene.add(road)

    // Spline centerline for debug visibility
    const centerGeom = new THREE.BufferGeometry().setFromPoints(trackPoints)
    const centerLine = new THREE.Line(
      centerGeom,
      new THREE.LineBasicMaterial({ color: 0xffff00 })
    )
    scene.add(centerLine)

    // Checkpoints visual
    checkpoints = data.checkpoints
    for (const cp of checkpoints) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(cp.w * 0.5, 0.1, 6, 16),
        new THREE.MeshBasicMaterial({ color: 0xffff66, wireframe: true })
      )
      ring.position.set(cp.p[0], cp.p[1] + 1.0, cp.p[2])
      ring.rotation.x = Math.PI / 2
      scene.add(ring)
      checkpointMeshes.push(ring)
    }

    // Item boxes
    for (const it of data.items) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x114488 })
      )
      box.position.set(it.pos[0], it.pos[1] + 0.5, it.pos[2])
      scene.add(box)
      itemBoxes.push({ mesh: box, pos: box.position.clone(), active: true, respawnAt: 0 })
    }

    // Surfaces (axis-aligned boxes). Box format: [cx,cy,cz, sx,sy,sz]
    for (const s of data.surfaces) {
      const cx = s.box[0], cy = s.box[1], cz = s.box[2]
      const sx = s.box[3], sy = s.box[4], sz = s.box[5]
      const min = new THREE.Vector3(cx - sx * 0.5, cy - sy * 0.5, cz - sz * 0.5)
      const max = new THREE.Vector3(cx + sx * 0.5, cy + sy * 0.5, cz + sz * 0.5)
      const dbg = new THREE.Mesh(
        new THREE.BoxGeometry(sx, 0.05, sz),
        new THREE.MeshBasicMaterial({ color: s.type === 'mud' ? 0x553311 : s.type === 'curb' ? 0xbbbbbb : 0x333333, transparent: true, opacity: 0.25 })
      )
      dbg.position.set(cx, cy + 0.03, cz)
      scene.add(dbg)
      surfaces.push({ type: s.type, min, max, mesh: dbg })
    }

    // Pads (boost pads)
    for (const p of data.pads) {
      const pos = new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2])
      const padMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.05, 4),
        new THREE.MeshBasicMaterial({ color: 0x00ddff })
      )
      padMesh.position.set(pos.x, pos.y + 0.03, pos.z)
      scene.add(padMesh)
      pads.push({ pos, mesh: padMesh })
    }

    // Barriers (visual + physics)
    if (data.barriers) {
      for (const b of data.barriers) {
        const c = new THREE.Vector3(b.center[0], b.center[1], b.center[2])
        const h = new THREE.Vector3(b.half[0], b.half[1], b.half[2])
        const boxMesh = new THREE.Mesh(
          new THREE.BoxGeometry(h.x * 2, h.y * 2, h.z * 2),
          new THREE.MeshStandardMaterial({ color: 0x884444, transparent: true, opacity: 0.3 })
        )
        boxMesh.position.copy(c)
        boxMesh.rotation.y = b.yaw
        scene.add(boxMesh)
        addStaticBox(phys.world, { x: c.x, y: c.y, z: c.z }, { x: h.x, y: h.y, z: h.z }, b.yaw, phys.barrierMat)
      }
    }
  }
  loadTrackData()

  // Resize handling
  function onResize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  let last = performance.now()
  let rafId = 0
  let isReplaying = false
  const replayFrames: { t: number; player?: { x: number; y: number; z: number; yaw: number }; ai?: { x: number; y: number; z: number; yaw: number } }[] = []
  let replayIndex = 0

  // Entities: player and simple AI
  type EntityData = {
    eid: number
    body: any
    mesh: THREE.Object3D
    isPlayer: boolean
    boostTime: number
    shieldUntil: number
    spinUntil: number
    lightningUntil: number
    lastCheckpoint: number
    laps: number
    finished: boolean
    finishRank: number
    lapStartMs: number
    lapTimes: number[]
  }
  const entities: EntityData[] = []
  let playerData: EntityData | null = null
  let aiData: EntityData | null = null
  let playerItem: 'Boost' | 'Homing' | 'Banana' | 'Shield' | 'Lightning' | 'Triples' | null = null
  const bananas: { pos: THREE.Vector3; expiresAt: number }[] = []
  const missiles: { pos: THREE.Vector3; vel: THREE.Vector3; target?: EntityData; expiresAt: number }[] = []

  // Tournament & results
  const pointsTable = [10, 8, 6, 5, 4, 3, 2, 1]
  let tournamentRaceIndex = 1
  const tournamentRaceTotal = 3
  const totals = new Map<EntityData, number>()
  const names = new Map<EntityData, string>()
  let resultsOverlay: HTMLDivElement | null = null
  let showingResults = false
  function ensureOverlay() {
    if (resultsOverlay) return resultsOverlay
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.inset = '0'
    div.style.background = 'rgba(0,0,0,0.55)'
    div.style.display = 'flex'
    div.style.alignItems = 'center'
    div.style.justifyContent = 'center'
    div.style.color = '#fff'
    div.style.zIndex = '1000'
    div.style.font = '16px system-ui, sans-serif'
    div.style.pointerEvents = 'auto'
    document.body.appendChild(div)
    resultsOverlay = div
    return div
  }
  function hideOverlay() {
    if (resultsOverlay) {
      resultsOverlay.remove()
      resultsOverlay = null
    }
  }
  function computeProgress(ed: EntityData) {
    // laps plus checkpoint progress
    if (checkpoints.length === 0) return ed.laps
    const next = (ed.lastCheckpoint + 1) % checkpoints.length
    const cp = checkpoints[next]
    const px = Transform.x[ed.eid]
    const pz = Transform.z[ed.eid]
    const dx = px - cp.p[0]
    const dz = pz - cp.p[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const norm = Math.max(0.001, cp.w)
    const frac = 1 - Math.min(1, dist / norm)
    return ed.laps + frac * (1 / checkpoints.length)
  }
  function rankEntities() {
    return [...entities].sort((a, b) => computeProgress(b) - computeProgress(a))
  }
  function awardPointsAndShow() {
    const ordered = rankEntities()
    for (let i = 0; i < ordered.length; i++) {
      const ed = ordered[i]
      const add = pointsTable[i] ?? 0
      totals.set(ed, (totals.get(ed) ?? 0) + add)
      ed.finishRank = i + 1
    }
    const overlay = ensureOverlay()
    overlay.innerHTML = ''
    const panel = document.createElement('div')
    panel.style.background = 'rgba(20,20,24,0.9)'
    panel.style.padding = '20px 24px'
    panel.style.borderRadius = '12px'
    panel.style.minWidth = '360px'
    panel.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5)'
    const title = document.createElement('div')
    title.textContent = `Race ${tournamentRaceIndex} Results`
    title.style.fontSize = '20px'
    title.style.marginBottom = '12px'
    panel.appendChild(title)
    const list = document.createElement('div')
    for (let i = 0; i < ordered.length; i++) {
      const ed = ordered[i]
      const row = document.createElement('div')
      row.style.display = 'flex'
      row.style.justifyContent = 'space-between'
      row.style.padding = '6px 0'
      const nm = names.get(ed) ?? 'Racer'
      row.innerHTML = `<span>#${i + 1} ${nm}</span><span>+${pointsTable[i] ?? 0} pts (Total ${totals.get(ed) ?? 0})</span>`
      list.appendChild(row)
    }
    panel.appendChild(list)

    // Lap split times for player
    if (playerData && playerData.lapTimes.length > 0) {
      const lapsDiv = document.createElement('div')
      lapsDiv.style.marginTop = '10px'
      const title2 = document.createElement('div')
      title2.textContent = 'Lap Times (You)'
      title2.style.fontSize = '14px'
      title2.style.opacity = '0.9'
      title2.style.marginBottom = '4px'
      lapsDiv.appendChild(title2)
      for (let i = 0; i < playerData.lapTimes.length; i++) {
        const t = playerData.lapTimes[i]
        const row = document.createElement('div')
        row.style.display = 'flex'
        row.style.justifyContent = 'space-between'
        row.style.fontSize = '13px'
        row.style.opacity = '0.9'
        row.innerHTML = `<span>Lap ${i + 1}</span><span>${t.toFixed(2)}s</span>`
        lapsDiv.appendChild(row)
      }
      panel.appendChild(lapsDiv)
    }
    const controls = document.createElement('div')
    controls.style.marginTop = '16px'
    const btn = document.createElement('button')
    btn.textContent = tournamentRaceIndex < tournamentRaceTotal ? 'Continue' : 'Finish Cup'
    btn.style.padding = '8px 12px'
    btn.style.borderRadius = '8px'
    btn.style.border = '0'
    btn.style.cursor = 'pointer'
    btn.onclick = () => {
      hideOverlay()
      showingResults = false
      if (tournamentRaceIndex < tournamentRaceTotal) {
        tournamentRaceIndex += 1
        resetForNextRace()
      } else {
        // reset tournament
        tournamentRaceIndex = 1
        totals.clear()
        resetForNextRace()
      }
    }
    controls.appendChild(btn)
    const replayBtn = document.createElement('button')
    replayBtn.textContent = 'Replay'
    replayBtn.style.padding = '8px 12px'
    replayBtn.style.borderRadius = '8px'
    replayBtn.style.border = '0'
    replayBtn.style.cursor = 'pointer'
    replayBtn.style.marginLeft = '12px'
    replayBtn.onclick = () => {
      hideOverlay()
      showingResults = false
      isReplaying = true
      replayIndex = 0
    }
    controls.appendChild(replayBtn)
    panel.appendChild(controls)
    overlay.appendChild(panel)
  }
  function resetForNextRace() {
    for (const ed of entities) {
      ed.laps = 0
      ed.lastCheckpoint = -1
      ed.finished = false
      ed.finishRank = 0
      ed.boostTime = 0
      ed.shieldUntil = 0
      ed.spinUntil = 0
      ed.lightningUntil = 0
      ed.lapTimes = []
      ed.lapStartMs = performance.now()
      InputComp.throttle[ed.eid] = 0
      InputComp.steer[ed.eid] = 0
      InputComp.drift[ed.eid] = 0
      InputComp.useItem[ed.eid] = 0
    }
    playerItem = null
    // reset positions on grid
    if (playerData) {
      playerData.body.velocity.setZero()
      playerData.body.angularVelocity.setZero()
      playerData.body.position.set(0, 0.6, 0)
      playerData.body.quaternion.setFromEuler(0, 0, 0)
    }
    if (aiData) {
      aiData.body.velocity.setZero()
      aiData.body.angularVelocity.setZero()
      aiData.body.position.set(2, 0.6, -6)
      aiData.body.quaternion.setFromEuler(0, 0, 0)
    }
  }
  function loop(now: number) {
    stats.begin()
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now

    // Pump input into component
    const s = input.get()
    if (playerData) {
      InputComp.throttle[playerData.eid] = s.throttle
      InputComp.steer[playerData.eid] = s.steer
      InputComp.drift[playerData.eid] = s.drift
      InputComp.useItem[playerData.eid] = s.useItem
    }

    // Drive logic updates yaw, drift, and target speed; apply forces
    driveSystem(world, dt)

    // Determine surface zone under kart for friction/accel/topSpeed scales
    let envAccel = 1.0
    let envTop = 1.0
    let currentSurface: 'tarmac' | 'mud' | 'curb' | 'ramp' = 'tarmac'
    const pxNow = physKart.position.x
    const pyNow = physKart.position.y
    const pzNow = physKart.position.z
    for (const s of surfaces) {
      if (pxNow >= s.min.x && pxNow <= s.max.x && pyNow >= s.min.y && pyNow <= s.max.y && pzNow >= s.min.z && pzNow <= s.max.z) {
        currentSurface = s.type
        break
      }
    }
    if (currentSurface === 'mud') { envAccel = 0.75; envTop = 0.75; physKart.linearDamping = 0.3 }
    else if (currentSurface === 'curb') { envAccel = 0.9; envTop = 0.9; physKart.linearDamping = 0.15 }
    else { envAccel = 1.0; envTop = 1.0; physKart.linearDamping = 0.05 }

    // Boost pad trigger (instant + decay)
    for (const p of pads) {
      const dxp = pxNow - p.pos.x
      const dzp = pzNow - p.pos.z
      if (dxp * dxp + dzp * dzp < 2.5 * 2.5) {
        boostTime = Math.max(boostTime, 1.0)
      }
    }

    // Apply forward force and yaw torque based on input and velocity and surface
    function applyDriveForEntity(ed: EntityData, topScale: number) {
      const throttle = InputComp.throttle[ed.eid]
      const steerInput = InputComp.steer[ed.eid]
      const body = ed.body
      const MASS = 150
      const GRAV = 9.82
      // Surface grip coefficient (friction circle)
      const mu = currentSurface === 'mud' ? TUNING.SURFACE_MU.mud : currentSurface === 'curb' ? TUNING.SURFACE_MU.curb : TUNING.SURFACE_MU.tarmac
      const maxTraction = mu * MASS * GRAV

      // Orientation vectors derived from physics body quaternion (authoritative)
      const q = body.quaternion
      const yaw = Math.atan2(q.y * q.w * 2, 1 - 2 * (q.y * q.y + q.z * q.z))
      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))

      // Velocity decomposition
      const vel = new THREE.Vector3(body.velocity.x, 0, body.velocity.z)
      const vF = THREE.MathUtils.clamp(vel.dot(forward), -100, 100)
      const vLat = THREE.MathUtils.clamp(vel.dot(right), -100, 100)

      // Targets & forces
      let top = BASE_TOP * envTop * topScale
      if (ed.lightningUntil > now) top *= 0.7
      const accelForce = MASS * BASE_ACCEL * envAccel // long accel baseline
      const brakeForce = MASS * 18            // stronger braking

      let Fx = 0
      let Fz = 0

      // Longitudinal (throttle/brake)
      if (throttle > 0) {
        // approach top speed
        const speedError = Math.max(0, top - Math.max(0, vF))
        const long = Math.min(accelForce * throttle, speedError * MASS)
        Fx += forward.x * long
        Fz += forward.z * long
      } else if (throttle < 0) {
        const long = brakeForce * (-throttle) * (1 + Math.abs(vF))
        Fx -= forward.x * long * Math.sign(vF || 1)
        Fz -= forward.z * long * Math.sign(vF || 1)
      }

      // Lateral grip opposes slip
      const baseGrip = TUNING.BASE_GRIP
      const driftSlip = Drive.drifting[ed.eid] ? 0.3 : 0.0
      const surfaceGrip = currentSurface === 'mud' ? 0.7 : currentSurface === 'curb' ? 0.9 : 1.0
      const gripCoeff = baseGrip * surfaceGrip * (1 - driftSlip)
      const FlatMag = -vLat * gripCoeff * MASS
      Fx += right.x * FlatMag
      Fz += right.z * FlatMag

      // Traction circle: limit combined force
      const Fmag = Math.hypot(Fx, Fz)
      if (Fmag > maxTraction) {
        const scale = maxTraction / Fmag
        Fx *= scale
        Fz *= scale
      }
      body.applyForce({ x: Fx, y: 0, z: Fz } as any, body.position as any)

      // Steering: torque-based, reduced at high speed
      const speedAbs = Math.abs(vF)
      const steerEff = THREE.MathUtils.clamp(1 - speedAbs / (top + 1e-3), TUNING.MIN_STEER_EFF, 1)
      let steer = steerInput * steerEff * (ed.lightningUntil > now ? 1.1 : 1.0)
      if (speedAbs < TUNING.LOW_SPEED_ASSIST_ON) steer *= TUNING.LOW_SPEED_ASSIST_GAIN
      if (speedAbs > TUNING.LOW_SPEED_ASSIST_OFF) steer *= 1.0
      const yawTorque = steer * MASS * 12 * BASE_HANDLING
      body.torque.y += yawTorque

      // Downforce and angular damping for stability
      const downforce = 0.6 * speedAbs * speedAbs
      body.applyForce({ x: 0, y: -downforce, z: 0 } as any, body.position as any)
      body.angularDamping = 0.6

      // Clamp yaw rate
      const maxYaw = 2.2 // rad/s
      if (Math.abs(body.angularVelocity.y) > maxYaw) {
        body.angularVelocity.y = Math.sign(body.angularVelocity.y) * maxYaw
      }

      // Ensure translation reflects drive velocity (authoritative forward speed)
      // This directly aligns physics velocity with ECS-computed forward speed so the kart actually moves.
      const desiredForwardSpeed = Math.max(0, Math.min(top, Drive.vel[ed.eid]))
      const currentForwardSpeed = vF
      const deltaForward = desiredForwardSpeed - currentForwardSpeed
      // Nudge velocity toward desired forward speed each frame
      body.velocity.x += forward.x * deltaForward
      body.velocity.z += forward.z * deltaForward
    }
    if (playerData) applyDriveForEntity(playerData, speedScaleRef.topSpeedScale || 1)
    if (aiData) applyDriveForEntity(aiData, 1)

    // Physics stepping
    stepWorld(phys.world, dt)

    // Sync ECS Transform with physics body (or replay frame)
    function syncTransformFromBody(ed: EntityData) {
      Transform.x[ed.eid] = ed.body.position.x
      Transform.y[ed.eid] = ed.body.position.y
      Transform.z[ed.eid] = ed.body.position.z
      // Do not write yaw here; steering is torque-only (physics authoritative).
    }
    function applyReplayFrame(index: number) {
      const f = replayFrames[index]
      if (!f) return
      if (playerData && f.player) {
        playerData.body.position.set(f.player.x, f.player.y, f.player.z)
        playerData.body.quaternion.setFromEuler(0, f.player.yaw, 0)
      }
      if (aiData && f.ai) {
        aiData.body.position.set(f.ai.x, f.ai.y, f.ai.z)
        aiData.body.quaternion.setFromEuler(0, f.ai.yaw, 0)
      }
    }
    if (isReplaying) {
      replayIndex = Math.min(replayIndex + 1, Math.max(0, replayFrames.length - 1))
      applyReplayFrame(replayIndex)
    }
    if (playerData) syncTransformFromBody(playerData)
    if (aiData) syncTransformFromBody(aiData)

    renderSystem(world)

    // Boost decay handling (affects top speed)
    if (playerData && playerData.boostTime > 0) {
      playerData.boostTime -= dt
      speedScaleRef.topSpeedScale = 1 + 0.3 * (playerData.boostTime > 0 ? 1 : 0)
    } else {
      speedScaleRef.topSpeedScale = 1
    }

    // Checkpoints & lap count
    function updateLapForEntity(ed: EntityData) {
      if (checkpoints.length === 0) return
      const px = Transform.x[ed.eid]
      const pz = Transform.z[ed.eid]
      const expected = (ed.lastCheckpoint + 1) % checkpoints.length
      const cp = checkpoints[expected]
      const dx = px - cp.p[0]
      const dz = pz - cp.p[2]
      const distSq = dx * dx + dz * dz
      const r = cp.w * 0.5
      if (distSq < r * r) {
        ed.lastCheckpoint = expected
      }
      const start = checkpoints[0]
      const dxs = px - start.p[0]
      const dzs = pz - start.p[2]
      const nearStart = dxs * dxs + dzs * dzs < (start.w * 0.4) * (start.w * 0.4)
      if (nearStart && ed.lastCheckpoint === checkpoints.length - 1 && !ed.finished) {
        ed.laps += 1
        ed.lastCheckpoint = 0
        const lapSec = Math.max(0, (now - ed.lapStartMs) / 1000)
        if (!Number.isNaN(lapSec) && lapSec > 0.01) ed.lapTimes.push(lapSec)
        ed.lapStartMs = now
        if (ed.laps >= lapsTarget) {
          ed.finished = true
        }
      }
    }
    if (playerData) updateLapForEntity(playerData)
    if (aiData) updateLapForEntity(aiData)

    // Item boxes interaction + respawn
    if (itemBoxes.length > 0) {
      const nowMs = performance.now()
      for (const ib of itemBoxes) {
        if (!ib.active && nowMs >= ib.respawnAt) {
          ib.active = true
          ib.mesh.visible = true
        }
        if (!ib.active) continue
        // Player pickup
        if (playerData) {
          const dx = Transform.x[playerData.eid] - ib.pos.x
          const dz = Transform.z[playerData.eid] - ib.pos.z
          if (dx * dx + dz * dz < 2.2 * 2.2) {
            if (!playerItem) {
              const position = 1
              const item = rollItem(position, 0)
              playerItem = item
            }
            ib.active = false
            ib.mesh.visible = false
            ib.respawnAt = nowMs + 5000
          }
        }
        // AI ignore items for now
      }
    }

    // Player item usage
    if (playerData && playerItem && InputComp.useItem[playerData.eid]) {
      if (playerItem === 'Boost') {
        playerData.boostTime = Math.max(playerData.boostTime, 1.2 * BOOST_SCALE)
      } else if (playerItem === 'Shield') {
        playerData.shieldUntil = now + 5000
      } else if (playerItem === 'Banana') {
        const drop = new THREE.Vector3(Transform.x[playerData.eid], 0, Transform.z[playerData.eid])
        bananas.push({ pos: drop, expiresAt: performance.now() + 20000 })
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffcc00 }))
        m.position.copy(drop)
        scene.add(m)
        // attach for visual lifetime
        setTimeout(() => { scene.remove(m) }, 20000)
      } else if (playerItem === 'Lightning') {
        const targets = entities.filter(e => !e.isPlayer)
        for (const t of targets) {
          if (t.shieldUntil > now) continue
          t.lightningUntil = now + 3500
        }
      } else if (playerItem === 'Homing') {
        if (aiData) {
          const start = new THREE.Vector3(Transform.x[playerData.eid], 0.5, Transform.z[playerData.eid])
          const yaw = Transform.yaw[playerData.eid]
          const vel = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(35)
          missiles.push({ pos: start, vel, target: aiData, expiresAt: performance.now() + 4000 })
          const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0xff4444 }))
          mesh.position.copy(start)
          scene.add(mesh)
          // simple visual updater
          const id = setInterval(() => {
            mesh.position.copy(start)
          }, 50)
          setTimeout(() => { clearInterval(id); scene.remove(mesh) }, 4000)
        }
      }
      playerItem = null
      InputComp.useItem[playerData.eid] = 0
    }

    // Update banana collisions
    if (bananas.length > 0) {
      const nowMs2 = performance.now()
      for (const ed of entities) {
        for (const b of bananas) {
          if (nowMs2 > b.expiresAt) continue
          const dx = Transform.x[ed.eid] - b.pos.x
          const dz = Transform.z[ed.eid] - b.pos.z
          if (dx * dx + dz * dz < 1.0 * 1.0) {
            if (ed.shieldUntil > now) continue
            ed.spinUntil = now + 900
            // small slowdown
            ed.body.velocity.scale(0.5, ed.body.velocity)
          }
        }
      }
    }

    // Update missiles
    if (missiles.length > 0 && aiData) {
      const nowMs3 = performance.now()
      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i]
        if (nowMs3 > m.expiresAt) { missiles.splice(i, 1); continue }
        if (m.target) {
          const tp = new THREE.Vector3(Transform.x[m.target.eid], 0.5, Transform.z[m.target.eid])
          const toTarget = tp.clone().sub(m.pos)
          const dist = toTarget.length()
          if (dist < 1.2) {
            if (m.target.shieldUntil <= now) {
              m.target.spinUntil = now + 900
              m.target.body.velocity.scale(0.5, m.target.body.velocity)
            }
            missiles.splice(i, 1)
            continue
          }
          toTarget.normalize()
          m.vel.lerp(toTarget.multiplyScalar(35), 0.1)
        }
        m.pos.addScaledVector(m.vel, dt)
      }
    }

    // AI control: steer to a point along track
    if (aiData && trackPoints.length > 0) {
      const ap = new THREE.Vector3(Transform.x[aiData.eid], 0, Transform.z[aiData.eid])
      // find nearest track point index
      let nearest = 0
      let best = Infinity
      for (let i = 0; i < trackPoints.length; i++) {
        const d = ap.distanceToSquared(trackPoints[i])
        if (d < best) { best = d; nearest = i }
      }
      const look = (nearest + 5) % trackPoints.length
      const target = trackPoints[look]
      const dir = new THREE.Vector3().subVectors(target, ap)
      const desiredYaw = Math.atan2(dir.x, dir.z)
      const yaw = Transform.yaw[aiData.eid]
      let diff = desiredYaw - yaw
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      InputComp.steer[aiData.eid] = Math.max(-1, Math.min(1, diff * 1.5))
      InputComp.throttle[aiData.eid] = 1
      InputComp.drift[aiData.eid] = Math.abs(diff) > 0.4 ? 1 : 0
      InputComp.useItem[aiData.eid] = 0
    }

    // Check race completion and show results
    const allFinished = entities.every(e => e.finished || e.laps >= lapsTarget)
    if (!isReplaying && allFinished && !showingResults) {
      showingResults = true
      awardPointsAndShow()
    }

    // Follow camera
    if (playerData) {
      const camTarget = new THREE.Vector3(
        Transform.x[playerData.eid] - 6 * Math.sin(Transform.yaw[playerData.eid]),
        5,
        Transform.z[playerData.eid] - 6 * Math.cos(Transform.yaw[playerData.eid])
      )
      camera.position.lerp(camTarget, 0.1)
      camera.lookAt(Transform.x[playerData.eid], 1.0, Transform.z[playerData.eid])
    }

    // Player steering angle (front wheel visuals + steering wheel + arms)
    let steerAngle = 0
    let forwardSpeed = 0
    if (playerData) {
      const steerInput = InputComp.steer[playerData.eid]
      const MAX_STEER_VISUAL = 0.45 // radians
      steerAngle = THREE.MathUtils.clamp(steerInput, -1, 1) * MAX_STEER_VISUAL
      const v = Drive.vel[playerData.eid] || 0
      forwardSpeed = Math.max(0, v)
    }

    // Animate steering pivots smoothly
    pivotFL.rotation.y = THREE.MathUtils.lerp(pivotFL.rotation.y, steerAngle, 0.25)
    pivotFR.rotation.y = THREE.MathUtils.lerp(pivotFR.rotation.y, steerAngle, 0.25)

    // Wheel spin from linear speed
    const WHEEL_RADIUS = 0.35
    const omega = (forwardSpeed / WHEEL_RADIUS)
    const spinDelta = omega * dt
    wFL.rotation.x -= spinDelta
    wFR.rotation.x -= spinDelta
    wRL.rotation.x -= spinDelta
    wRR.rotation.x -= spinDelta

    // Capybara micro-animation
    animTime += dt
    const speedNorm = THREE.MathUtils.clamp(forwardSpeed / 30, 0, 1)
    head.position.y = baseHeadY + Math.sin(animTime * 10) * 0.01 * speedNorm
    steeringPivot.rotation.y = THREE.MathUtils.lerp(steeringPivot.rotation.y, steerAngle * 1.8, 0.25)
    armL.rotation.z = THREE.MathUtils.lerp(armL.rotation.z, baseArmLRotZ - steerAngle * 0.6, 0.25)
    armR.rotation.z = THREE.MathUtils.lerp(armR.rotation.z, baseArmRRotZ + steerAngle * 0.6, 0.25)

    renderer.render(scene, camera)

    // Replay record & HUD update
    if (!paused && !isReplaying) {
      const frame: any = { t: now }
      if (playerData) frame.player = { x: Transform.x[playerData.eid], y: Transform.y[playerData.eid], z: Transform.z[playerData.eid], yaw: Transform.yaw[playerData.eid] }
      if (aiData) frame.ai = { x: Transform.x[aiData.eid], y: Transform.y[aiData.eid], z: Transform.z[aiData.eid], yaw: Transform.yaw[aiData.eid] }
      replayFrames.push(frame)
    }

    if (currentSurface !== lastSurfaceType) lastSurfaceType = currentSurface
    const speed = playerData ? Drive.vel[playerData.eid].toFixed(1) : '0.0'
    const boostTag = playerData && playerData.boostTime > 0 ? ' BOOST' : ''
    hudSpeed.textContent = `Speed: ${speed} m/s${boostTag}`

    // Rank and lap at top-center
    let rankText = '—'
    if (playerData) {
      const ordered = rankEntities()
      const idx = ordered.findIndex(e => e === playerData)
      if (idx >= 0) rankText = `${idx + 1}/${ordered.length}`
    }
    hudTop.textContent = `${currentTrackName} • Lap ${playerData?.laps ?? 0}/${lapsTarget} • Pos ${rankText}`

    // Item icon bottom-right
    hudItem.textContent = playerItem ? String(playerItem) : ''

    // Mini-map drawing
    const ctx = mini.getContext('2d')!
    ctx.clearRect(0, 0, mini.width, mini.height)
    if (trackPoints.length > 1) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
      for (const p of trackPoints) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z) }
      const w = maxX - minX || 1
      const h = maxZ - minZ || 1
      const pad = 6
      const scale = Math.min((mini.width - pad * 2) / w, (mini.height - pad * 2) / h)
      const ox = pad - minX * scale
      const oy = pad - minZ * scale
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < trackPoints.length; i++) {
        const p = trackPoints[i]
        const x = p.x * scale + ox
        const y = p.z * scale + oy
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      // Player point
      if (playerData) {
        const px = Transform.x[playerData.eid] * scale + ox
        const py = Transform.z[playerData.eid] * scale + oy
        ctx.fillStyle = '#0ff'
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
      }
      // AI point
      if (aiData) {
        const ax = Transform.x[aiData.eid] * scale + ox
        const ay = Transform.z[aiData.eid] * scale + oy
        ctx.fillStyle = '#f66'
        ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI * 2); ctx.fill()
      }
    }
    stats.end()
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)

  onResize()

  // Setup physics world and kart body
  const phys = createPhysicsWorld()
  addGround(phys.world, phys.groundMat)
  // Player entity setup
  const physKart = createKartBody(phys.world, phys.defaultMat)
  playerData = {
    eid: player,
    body: physKart,
    mesh: kartGroup,
    isPlayer: true,
    boostTime: 0,
    shieldUntil: 0,
    spinUntil: 0,
    lightningUntil: 0,
    lastCheckpoint: -1,
    laps: 0,
    finished: false,
    finishRank: 0,
    lapStartMs: performance.now(),
    lapTimes: [],
  }
  entities.push(playerData)

  // Simple AI entity setup
  const aiEid = addEntity(world)
  addComponent(world, Transform, aiEid)
  addComponent(world, Drive, aiEid)
  addComponent(world, InputComp, aiEid)
  Transform.x[aiEid] = 2
  Transform.y[aiEid] = 0
  Transform.z[aiEid] = -6
  Transform.yaw[aiEid] = 0
  Drive.vel[aiEid] = 0
  const aiMesh = kartGroup.clone(true)
  scene.add(aiMesh)
  meshes.set(aiEid, aiMesh)
  const aiBody = createKartBody(phys.world, phys.defaultMat)
  aiBody.position.set(2, 0.6, -6)
  aiData = {
    eid: aiEid,
    body: aiBody,
    mesh: aiMesh,
    isPlayer: false,
    boostTime: 0,
    shieldUntil: 0,
    spinUntil: 0,
    lightningUntil: 0,
    lastCheckpoint: -1,
    laps: 0,
    finished: false,
    finishRank: 0,
    lapStartMs: performance.now(),
    lapTimes: [],
  }
  entities.push(aiData)

  // Cleanup
  return () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('keydown', controlsKeyHandler)
    window.removeEventListener('keydown', pauseKeyHandler)
    input.dispose()
    stats.dom.remove()
    renderer.dispose()
    hudRoot.remove()
    controls.remove()
    if (pauseOverlay) pauseOverlay.remove()
    if (resultsOverlay) resultsOverlay.remove()
  }
}


