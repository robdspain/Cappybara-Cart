import { Engine, Scene } from '@babylonjs/core'
import '@babylonjs/loaders'
import { setupScene } from './setupScene'
import { makeFixedUpdate } from '../core/time'
import { runAllSystems } from '../systems/runner'

let engine: Engine
let scene: Scene
const fixed = makeFixedUpdate(1/60, 5)

export function bootstrapRenderer() {
  const canvas = document.createElement('canvas')
  canvas.id = 'game-canvas'
  document.body.appendChild(canvas)

  engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true)
  scene = new Scene(engine)
  setupScene(scene)

  engine.runRenderLoop(() => {
    fixed((dt)=> runAllSystems(dt))
    scene.render()
  })

  window.addEventListener('resize', () => engine.resize())
}

export function getScene() { return scene }
export function getEngine() { return engine }
