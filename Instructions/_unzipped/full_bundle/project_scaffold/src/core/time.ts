export function makeFixedUpdate(step = 1/60, maxSteps = 5) {
  let acc = 0, last = performance.now()
  return (update: (dt:number)=>void) => {
    const now = performance.now()
    acc += Math.min(0.25, (now - last) / 1000)
    last = now
    let steps = 0
    while (acc >= step && steps++ < maxSteps) {
      update(step)
      acc -= step
    }
  }
}
