import * as THREE from 'three'

export type TrackGraphicsConfig = {
  edgeStrip: { innerOffset: number; outerOffset: number; height: number; color: number }
  dashedCenter: { enabled: boolean; height: number; dashSize: number; gapSize: number; color: number }
  curb: { blockLength: number; lateralOffset: number; width: number; height: number; red: number; white: number }
  posts: { step: number; lateralOffset: number; height: number; radius: number; colors: [number, number] }
  chevrons: { curvatureThreshold: number; standoff: number; height: number; size: { w: number; h: number; d: number }; color: number }
}

export const defaultTrackGraphicsConfig: TrackGraphicsConfig = {
  edgeStrip: { innerOffset: -0.12, outerOffset: -0.02, height: 0.06, color: 0xffffff },
  dashedCenter: { enabled: true, height: 0.061, dashSize: 1.2, gapSize: 0.7, color: 0xffffff },
  curb: { blockLength: 0.8, lateralOffset: 0.4, width: 0.35, height: 0.12, red: 0xd72638, white: 0xffffff },
  posts: { step: 4, lateralOffset: 0.9, height: 0.6, radius: 0.12, colors: [0x2b6cb0, 0xffffff] },
  chevrons: { curvatureThreshold: 0.08, standoff: 1.3, height: 0.8, size: { w: 1.2, h: 0.6, d: 0.05 }, color: 0xff3b30 },
}

export function buildTrackVisuals(
  scene: THREE.Scene,
  trackPoints: THREE.Vector3[],
  lefts: THREE.Vector3[],
  rights: THREE.Vector3[],
  width: number,
  cfg: TrackGraphicsConfig = defaultTrackGraphicsConfig
) {
  const created: THREE.Object3D[] = []

  function buildEdgeStrip(points: THREE.Vector3[], inwardSign: 1 | -1) {
    const positions: number[] = []
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const n = points[(i + 1) % points.length]
      const dirv = new THREE.Vector3().subVectors(n, p).setY(0).normalize()
      const normal = new THREE.Vector3(-dirv.z, 0, dirv.x)
      const inner = p.clone().addScaledVector(normal, inwardSign * cfg.edgeStrip.innerOffset)
      const outer = p.clone().addScaledVector(normal, inwardSign * cfg.edgeStrip.outerOffset)
      positions.push(inner.x, cfg.edgeStrip.height, inner.z, outer.x, cfg.edgeStrip.height, outer.z)
    }
    const indices: number[] = []
    for (let i = 0; i < points.length; i++) {
      const a = i * 2
      const b = ((i + 1) % points.length) * 2
      indices.push(a, a + 1, b)
      indices.push(a + 1, b + 1, b)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setIndex(indices)
    g.computeVertexNormals()
    const m = new THREE.MeshStandardMaterial({ color: cfg.edgeStrip.color, roughness: 0.9, metalness: 0.0 })
    const mesh = new THREE.Mesh(g, m)
    mesh.receiveShadow = true
    scene.add(mesh)
    created.push(mesh)
  }
  buildEdgeStrip(lefts, 1)
  buildEdgeStrip(rights, -1)

  if (cfg.dashedCenter.enabled) {
    const centerGeom = new THREE.BufferGeometry().setFromPoints(
      trackPoints.map((p) => p.clone().setY(cfg.dashedCenter.height))
    )
    const dashedMat = new THREE.LineDashedMaterial({
      color: cfg.dashedCenter.color,
      dashSize: cfg.dashedCenter.dashSize,
      gapSize: cfg.dashedCenter.gapSize,
    })
    const centerDashed = new THREE.Line(centerGeom, dashedMat)
    centerDashed.computeLineDistances()
    scene.add(centerDashed)
    created.push(centerDashed)
  }

  function buildCurbs(points: THREE.Vector3[], outwardSign: 1 | -1) {
    const curbGeo = new THREE.BoxGeometry(cfg.curb.blockLength, cfg.curb.height, cfg.curb.width)
    const red = new THREE.MeshStandardMaterial({ color: cfg.curb.red, roughness: 0.6 })
    const white = new THREE.MeshStandardMaterial({ color: cfg.curb.white, roughness: 0.6 })
    const instRed = new THREE.InstancedMesh(curbGeo, red, points.length)
    const instWhite = new THREE.InstancedMesh(curbGeo, white, points.length)
    let rCount = 0, wCount = 0
    const mat4 = new THREE.Matrix4()
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const n = points[(i + 1) % points.length]
      const dirv = new THREE.Vector3().subVectors(n, p).setY(0).normalize()
      const normal = new THREE.Vector3(-dirv.z, 0, dirv.x)
      const mid = p.clone().add(n).multiplyScalar(0.5)
      const pos = mid.addScaledVector(normal, outwardSign * cfg.curb.lateralOffset)
      const yaw = Math.atan2(dirv.x, dirv.z)
      mat4.makeRotationY(yaw)
      mat4.setPosition(pos.x, cfg.curb.height - 0.01, pos.z)
      if (i % 2 === 0) instRed.setMatrixAt(rCount++, mat4)
      else instWhite.setMatrixAt(wCount++, mat4)
    }
    instRed.count = rCount
    instWhite.count = wCount
    scene.add(instRed)
    scene.add(instWhite)
    created.push(instRed, instWhite)
  }
  buildCurbs(lefts, 1)
  buildCurbs(rights, -1)

  function buildBarrierPosts(points: THREE.Vector3[], outwardSign: 1 | -1) {
    const postGeo = new THREE.CylinderGeometry(cfg.posts.radius, cfg.posts.radius, cfg.posts.height, 12)
    const blue = new THREE.MeshStandardMaterial({ color: cfg.posts.colors[0], roughness: 0.6 })
    const white = new THREE.MeshStandardMaterial({ color: cfg.posts.colors[1], roughness: 0.6 })
    const instBlue = new THREE.InstancedMesh(postGeo, blue, Math.ceil(points.length / 2))
    const instWhite = new THREE.InstancedMesh(postGeo, white, Math.ceil(points.length / 2))
    let b = 0, w = 0
    const mat4 = new THREE.Matrix4()
    for (let i = 0; i < points.length; i += cfg.posts.step) {
      const p = points[i]
      const n = points[(i + 1) % points.length]
      const dirv = new THREE.Vector3().subVectors(n, p).setY(0).normalize()
      const normal = new THREE.Vector3(-dirv.z, 0, dirv.x)
      const pos = p.clone().addScaledVector(normal, outwardSign * cfg.posts.lateralOffset)
      mat4.identity()
      mat4.setPosition(pos.x, cfg.posts.height * 0.5 + 0.05, pos.z)
      if (((i / cfg.posts.step) | 0) % 2 === 0) instBlue.setMatrixAt(b++, mat4)
      else instWhite.setMatrixAt(w++, mat4)
    }
    instBlue.count = b
    instWhite.count = w
    scene.add(instBlue)
    scene.add(instWhite)
    created.push(instBlue, instWhite)
  }
  buildBarrierPosts(lefts, 1)
  buildBarrierPosts(rights, -1)

  function placeChevrons(points: THREE.Vector3[]) {
    const { w, h, d } = cfg.chevrons.size
    const panelGeo = new THREE.BoxGeometry(w, h, d)
    const panelMat = new THREE.MeshStandardMaterial({ color: cfg.chevrons.color, roughness: 0.5 })
    const inst = new THREE.InstancedMesh(panelGeo, panelMat, points.length)
    let count = 0
    const mat4 = new THREE.Matrix4()
    for (let i = 0; i < points.length; i++) {
      const p0 = points[(i - 1 + points.length) % points.length]
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      const v01 = new THREE.Vector3().subVectors(p1, p0).setY(0).normalize()
      const v12 = new THREE.Vector3().subVectors(p2, p1).setY(0).normalize()
      const curvature = 1 - THREE.MathUtils.clamp(v01.dot(v12), -1, 1)
      if (curvature < cfg.chevrons.curvatureThreshold) continue
      const dirv = v12
      const normal = new THREE.Vector3(-dirv.z, 0, dirv.x)
      const pos = p1.clone().addScaledVector(normal, cfg.chevrons.standoff)
      const yaw = Math.atan2(dirv.x, dirv.z)
      mat4.makeRotationY(yaw)
      mat4.setPosition(pos.x, cfg.chevrons.height, pos.z)
      inst.setMatrixAt(count++, mat4)
    }
    inst.count = count
    scene.add(inst)
    created.push(inst)
  }
  placeChevrons(trackPoints)

  return {
    dispose() {
      for (const o of created) {
        if (o.parent) o.parent.remove(o)
        // best-effort disposal
        if ((o as any).geometry) (o as any).geometry.dispose?.()
        if ((o as any).material) {
          const m = (o as any).material
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose?.())
          else m.dispose?.()
        }
      }
    },
  }
}


