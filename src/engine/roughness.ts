import type { GrayImage, Point, Segment, Stroke } from './types'
import { clamp } from './density'
import { smoothNoise } from './noise'

const RESAMPLE = 6 // px between width samples along a line
const NOISE_SCALE = 26 // px; larger = smoother, more coherent width changes
const MAX_AMP = 0.45 // organic width-factor amplitude at roughness = 100

// Coverage = stroke width as a fraction of the line pitch.
const COV_MIN = 0.04 // over white: hairline, ~blank
const COV_MAX = 1.2 // over black: > pitch so neighbours merge into solid
const COV_CAP = 1.5 // hard ceiling (× pitch) to avoid runaway overlap
const GAMMA = 1.4 // > 1 boosts midtone contrast

const CROSS_HI = 0.55 // cross lines vanish above this brightness
const CROSS_LO = 0.3 // cross lines fully present below this brightness

export type WidthMode = 'main' | 'cross'

/** Resample a straight segment into points ~RESAMPLE px apart. */
function densify(a: Point, b: Point): Point[] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const count = Math.max(1, Math.round(len / RESAMPLE))
  const out: Point[] = []
  for (let i = 0; i <= count; i++) {
    const t = i / count
    out.push({ x: a.x + dx * t, y: a.y + dy * t })
  }
  return out
}

function sampleBrightness(gray: GrayImage, x: number, y: number): number {
  const xi = Math.min(gray.width - 1, Math.max(0, Math.floor(x)))
  const yi = Math.min(gray.height - 1, Math.max(0, Math.floor(y)))
  return gray.data[yi * gray.width + xi]
}

/**
 * Turn continuous hatch lines into variable-width strokes. Width is expressed as
 * a fraction of the line `pitch`, so dark areas thicken past the gap and merge
 * into solid tone while light areas thin to near-nothing — giving strong tonal
 * contrast (good form recognition) without fragmenting lines. `baseWidth` acts
 * as an overall weight. Cross-hatch lines fade to zero over light areas.
 */
export function modulateWidth(
  segments: Segment[],
  gray: GrayImage,
  pitch: number,
  baseWidth: number,
  roughness: number,
  mode: WidthMode = 'main',
  seed = 1,
): Stroke[] {
  const amp = (clamp(roughness, 0, 100) / 100) * MAX_AMP
  const weight = baseWidth / 2 // default lineWidth 2 -> weight 1
  const strokes: Stroke[] = []

  for (const seg of segments) {
    const pts = densify(seg.points[0], seg.points[1])
    const n = pts.length
    const widths = pts.map((p, i) => {
      const b = sampleBrightness(gray, p.x, p.y)
      let cov = COV_MIN + (COV_MAX - COV_MIN) * Math.pow(1 - b, GAMMA)

      if (mode === 'cross') {
        cov *= clamp((CROSS_HI - b) / (CROSS_HI - CROSS_LO), 0, 1)
      }

      cov *= weight
      if (amp > 0) cov *= 1 + smoothNoise(p.x, p.y, NOISE_SCALE, seed) * amp

      const edge = Math.min(i, n - 1 - i)
      if (edge < 2) cov *= 0.5 + 0.25 * edge // soft taper at line ends

      return clamp(cov, 0, COV_CAP) * pitch
    })
    strokes.push({ points: pts, widths })
  }
  return strokes
}
