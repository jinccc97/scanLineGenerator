import type { GrayImage, HatchResult, Point, Segment } from './types'
import { pitchFor } from './density'

export type HatchOptions = {
  lineDirection: number // degrees
  density: number // 0..100
  crossHatch: boolean
}

const SAMPLE_STEP = 1.5 // px, used to find where a line enters/exits the image

function inside(img: GrayImage, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < img.width && y < img.height
}

/**
 * Generate continuous parallel lines at `angleRad`, spaced by `pitch` along the
 * perpendicular axis. Each line is emitted as a single straight segment spanning
 * its visible portion of the image (no tonal fragmentation — tone is applied
 * later via line width).
 */
function generateLines(img: GrayImage, angleRad: number, pitch: number): Segment[] {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  let pMin = Infinity
  let pMax = -Infinity
  let dMin = Infinity
  let dMax = -Infinity
  const corners: Point[] = [
    { x: 0, y: 0 },
    { x: img.width, y: 0 },
    { x: 0, y: img.height },
    { x: img.width, y: img.height },
  ]
  for (const c of corners) {
    const pv = -sin * c.x + cos * c.y
    const dv = cos * c.x + sin * c.y
    if (pv < pMin) pMin = pv
    if (pv > pMax) pMax = pv
    if (dv < dMin) dMin = dv
    if (dv > dMax) dMax = dv
  }

  const segments: Segment[] = []
  for (let off = pMin; off <= pMax; off += pitch) {
    let entry: Point | null = null
    let exit: Point | null = null
    for (let t = dMin; t <= dMax; t += SAMPLE_STEP) {
      const x = cos * t - sin * off
      const y = sin * t + cos * off
      if (inside(img, x, y)) {
        if (!entry) entry = { x, y }
        exit = { x, y }
      }
    }
    if (entry && exit && (entry.x !== exit.x || entry.y !== exit.y)) {
      segments.push({ points: [entry, exit] })
    }
  }
  return segments
}

export function hatch(img: GrayImage, opts: HatchOptions): HatchResult {
  const pitch = pitchFor(opts.density)
  const angle = (opts.lineDirection * Math.PI) / 180

  const main = generateLines(img, angle, pitch)
  const cross = opts.crossHatch ? generateLines(img, angle + Math.PI / 2, pitch) : []
  return { main, cross }
}
