import type { RGBAImage } from './types'
import type { Settings } from '../state'
import { LITHO_INKS, DEFAULT_INKS, MAX_INKS, type InkKey } from './inks'
import { clamp, lerp } from './density'
import { hashNoise, smoothNoise } from './noise'
import { sampleRGB } from './sample'

export type Dot = { x: number; y: number; r: number }
export type LithoLayer = { ink: InkKey; hex: string; offset: { dx: number; dy: number }; dots: Dot[] }
export type LithoResult = { layers: LithoLayer[]; paper: string }

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

function adjustChannel(v: number, factor: number, offset: number): number {
  return clamp((v - 0.5) * factor + 0.5 + offset, 0, 1)
}

/**
 * Separate an image into <=4 risograph ink layers rendered as a 45° halftone
 * grid. Tone is carried by dot SIZE only (dark -> large, bright -> small,
 * brightest -> no dot). Inks are separated with a subtractive non-negative
 * least-squares fit so overlaps overprint. Each layer gets a small registration
 * offset; highlight cutoff is jittered so bright areas break up like spray.
 */
export function computeLithoLayers(src: RGBAImage, settings: Settings): LithoResult {
  const inkKeys = pickInks(settings.inks)
  const inkRgb = inkKeys.map((k) => hexToRgb01(LITHO_INKS[k].hex))
  const kVec = inkRgb.map((c) => [1 - c[0], 1 - c[1], 1 - c[2]] as [number, number, number])
  const kDot = kVec.map((k) => k[0] * k[0] + k[1] * k[1] + k[2] * k[2] || 1e-6)
  const n = inkKeys.length

  const pitch = lerp(18, 9, clamp(settings.density, 0, 100) / 100)
  const maxDot = pitch * 1.1
  const factor = 1 + clamp(settings.contrast, -100, 100) / 100
  const offset = (clamp(settings.brightness, -100, 100) / 100) * 0.5

  // 45° lattice basis.
  const angle = Math.PI / 4
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const vx = -Math.sin(angle)
  const vy = Math.cos(angle)

  let aMin = Infinity
  let aMax = -Infinity
  let bMin = Infinity
  let bMax = -Infinity
  for (const [cx, cy] of [[0, 0], [src.width, 0], [0, src.height], [src.width, src.height]]) {
    const a = (cx * ux + cy * uy) / pitch
    const b = (cx * vx + cy * vy) / pitch
    aMin = Math.min(aMin, a)
    aMax = Math.max(aMax, a)
    bMin = Math.min(bMin, b)
    bMax = Math.max(bMax, b)
  }

  // Per-layer registration offset (roughness -> 1..3 px); plate 0 stays put.
  const mag = 1 + (clamp(settings.roughness, 0, 100) / 100) * 2
  const layers: LithoLayer[] = inkKeys.map((ink, i) => {
    const ang = hashNoise(i + 1, 7, 3) * Math.PI * 2
    return {
      ink,
      hex: LITHO_INKS[ink].hex,
      offset: i === 0 ? { dx: 0, dy: 0 } : { dx: Math.cos(ang) * mag, dy: Math.sin(ang) * mag },
      dots: [],
    }
  })

  const x = new Array<number>(n).fill(0)
  for (let a = Math.floor(aMin) - 1; a <= Math.ceil(aMax) + 1; a++) {
    for (let b = Math.floor(bMin) - 1; b <= Math.ceil(bMax) + 1; b++) {
      const px = (a * ux + b * vx) * pitch
      const py = (a * uy + b * vy) * pitch
      if (px < 0 || py < 0 || px >= src.width || py >= src.height) continue

      const [r8, g8, b8] = sampleRGB(src, px, py)
      const tr = 1 - adjustChannel(r8 / 255, factor, offset)
      const tg = 1 - adjustChannel(g8 / 255, factor, offset)
      const tb = 1 - adjustChannel(b8 / 255, factor, offset)

      // Non-negative least squares via projected coordinate descent.
      x.fill(0)
      for (let iter = 0; iter < 8; iter++) {
        for (let i = 0; i < n; i++) {
          let dr = tr
          let dg = tg
          let db = tb
          for (let j = 0; j < n; j++) {
            if (j === i) continue
            dr -= x[j] * kVec[j][0]
            dg -= x[j] * kVec[j][1]
            db -= x[j] * kVec[j][2]
          }
          const num = dr * kVec[i][0] + dg * kVec[i][1] + db * kVec[i][2]
          x[i] = clamp(num / kDot[i], 0, 1)
        }
      }

      // Irregular highlight cutoff -> spray-like bright areas.
      const thr = Math.max(0, 0.05 + smoothNoise(px, py, 40, 9) * 0.06)
      for (let i = 0; i < n; i++) {
        if (x[i] <= thr) continue
        const radius = (x[i] * maxDot) / 2
        if (radius < 0.4) continue
        layers[i].dots.push({ x: px, y: py, r: radius })
      }
    }
  }

  return { layers, paper: settings.background }
}

/** Keep valid, de-duplicated ink keys, capped at MAX_INKS; fall back to default. */
export function pickInks(inks: InkKey[] | undefined): InkKey[] {
  const seen = new Set<InkKey>()
  for (const k of inks ?? []) {
    if (k in LITHO_INKS) seen.add(k)
    if (seen.size >= MAX_INKS) break
  }
  return seen.size ? [...seen] : [...DEFAULT_INKS]
}
