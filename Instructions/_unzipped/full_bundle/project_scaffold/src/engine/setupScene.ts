import { ArcRotateCamera, Color3, HemisphericLight, MeshBuilder, Scene, Vector3 } from '@babylonjs/core'

export function setupScene(scene: Scene) {
  scene.clearColor = new Color3(0.05, 0.05, 0.08)
  const camera = new ArcRotateCamera('cam', Math.PI/2, Math.PI/3, 20, new Vector3(0,0,0), scene)
  camera.attachControl(true)

  new HemisphericLight('sun', new Vector3(0,1,0), scene)

  // Placeholder track plane
  MeshBuilder.CreateGround('track', { width: 40, height: 40, subdivisions: 2 }, scene)
}
