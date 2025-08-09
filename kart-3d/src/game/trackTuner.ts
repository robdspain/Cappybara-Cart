import { defaultTrackGraphicsConfig, type TrackGraphicsConfig } from './trackGraphics'

export function createTrackTuner(
  cfgRef: { current: TrackGraphicsConfig },
  rebuild: () => void
) {
  const root = document.createElement('div')
  root.style.position = 'fixed'
  root.style.right = '10px'
  root.style.top = '10px'
  root.style.padding = '10px'
  root.style.background = 'rgba(20,20,26,0.85)'
  root.style.color = '#fff'
  root.style.font = '12px system-ui, sans-serif'
  root.style.borderRadius = '8px'
  root.style.zIndex = '1000'
  root.style.maxWidth = '260px'
  root.style.pointerEvents = 'auto'

  const title = document.createElement('div')
  title.textContent = 'Track Tuner (dev)'
  title.style.fontSize = '13px'
  title.style.marginBottom = '6px'
  root.appendChild(title)

  function row(label: string, input: HTMLElement) {
    const r = document.createElement('div')
    r.style.display = 'grid'
    r.style.gridTemplateColumns = '1fr auto'
    r.style.alignItems = 'center'
    r.style.gap = '8px'
    r.style.margin = '6px 0'
    const l = document.createElement('div')
    l.textContent = label
    r.appendChild(l)
    r.appendChild(input)
    return r
  }

  function slider(min: number, max: number, step: number, value: number, oninput: (v: number) => void) {
    const s = document.createElement('input') as HTMLInputElement
    s.type = 'range'; s.min = String(min); s.max = String(max); s.step = String(step); s.value = String(value)
    s.oninput = () => oninput(Number(s.value))
    return s
  }

  const cfg = cfgRef.current

  root.appendChild(row('Edge inner', slider(-0.4, 0.0, 0.01, cfg.edgeStrip.innerOffset, v => { cfg.edgeStrip.innerOffset = v; rebuild() })))
  root.appendChild(row('Edge outer', slider(-0.3, 0.2, 0.01, cfg.edgeStrip.outerOffset, v => { cfg.edgeStrip.outerOffset = v; rebuild() })))
  root.appendChild(row('Edge height', slider(0.01, 0.1, 0.001, cfg.edgeStrip.height, v => { cfg.edgeStrip.height = v; rebuild() })))
  root.appendChild(row('Dash size', slider(0.2, 3.0, 0.1, cfg.dashedCenter.dashSize, v => { cfg.dashedCenter.dashSize = v; rebuild() })))
  root.appendChild(row('Gap size', slider(0.2, 3.0, 0.1, cfg.dashedCenter.gapSize, v => { cfg.dashedCenter.gapSize = v; rebuild() })))
  root.appendChild(row('Curb length', slider(0.3, 1.5, 0.05, cfg.curb.blockLength, v => { cfg.curb.blockLength = v; rebuild() })))
  root.appendChild(row('Curb offset', slider(0.0, 1.0, 0.02, cfg.curb.lateralOffset, v => { cfg.curb.lateralOffset = v; rebuild() })))
  root.appendChild(row('Curb width', slider(0.1, 0.8, 0.02, cfg.curb.width, v => { cfg.curb.width = v; rebuild() })))
  root.appendChild(row('Post step', slider(1, 12, 1, cfg.posts.step, v => { cfg.posts.step = Math.round(v); rebuild() })))
  root.appendChild(row('Post offset', slider(0.2, 2.0, 0.05, cfg.posts.lateralOffset, v => { cfg.posts.lateralOffset = v; rebuild() })))
  root.appendChild(row('Chevron curve', slider(0.02, 0.2, 0.005, cfg.chevrons.curvatureThreshold, v => { cfg.chevrons.curvatureThreshold = v; rebuild() })))
  root.appendChild(row('Chevron standoff', slider(0.5, 3.0, 0.05, cfg.chevrons.standoff, v => { cfg.chevrons.standoff = v; rebuild() })))

  document.body.appendChild(root)

  return () => { root.remove() }
}


