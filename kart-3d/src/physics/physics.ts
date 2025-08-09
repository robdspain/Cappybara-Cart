import { World, Body, Box, Plane, Vec3, Quaternion, Material, ContactMaterial } from 'cannon-es'

export function createPhysicsWorld() {
  const world = new World()
  world.gravity.set(0, -9.82, 0)
  const defaultMat = new Material('default')
  const groundMat = new Material('ground')
  const barrierMat = new Material('barrier')

  const defaultVsGround = new ContactMaterial(defaultMat, groundMat, {
    friction: 0.6,
    restitution: 0.0,
    contactEquationStiffness: 1e7,
    contactEquationRelaxation: 3,
  })
  world.addContactMaterial(defaultVsGround)
  world.defaultContactMaterial = defaultVsGround

  const defaultVsBarrier = new ContactMaterial(defaultMat, barrierMat, {
    friction: 0.3,
    restitution: 0.0,
    contactEquationStiffness: 1e7,
    contactEquationRelaxation: 3,
  })
  world.addContactMaterial(defaultVsBarrier)

  return { world, defaultMat, groundMat, barrierMat }
}

export function addGround(world: World, groundMat: Material) {
  const ground = new Body({ mass: 0, material: groundMat })
  ground.addShape(new Plane())
  // rotate plane so normal is up (Y)
  ground.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2)
  world.addBody(ground)
  return ground
}

export function createKartBody(world: World, defaultMat: Material) {
  // approximate kart as a box collider
  const half = new Vec3(0.9, 0.35, 1.3)
  const body = new Body({ mass: 150, material: defaultMat })
  body.addShape(new Box(half))
  body.position.set(0, 0.6, 0)
  body.angularDamping = 0.6
  body.linearDamping = 0.2
  ;(body as any).allowSleep = false
  world.addBody(body)
  return body
}

export function stepWorld(world: World, dt: number) {
  const fixed = 1 / 60
  world.step(fixed, dt, 3)
}

export function addStaticBox(
  world: World,
  center: { x: number; y: number; z: number },
  half: { x: number; y: number; z: number },
  yawRadians: number,
  material?: Material
) {
  const body = new Body({ mass: 0, material: material })
  body.addShape(new Box(new Vec3(half.x, half.y, half.z)))
  body.position.set(center.x, center.y, center.z)
  const q = new Quaternion()
  q.setFromAxisAngle(new Vec3(0, 1, 0), yawRadians)
  body.quaternion.copy(q)
  world.addBody(body)
  return body
}


