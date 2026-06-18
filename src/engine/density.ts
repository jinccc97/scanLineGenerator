export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Map the density slider (0..100) to a line pitch (perpendicular gap, px).
 * Higher density -> smaller pitch -> more lines.
 */
export function pitchFor(density: number): number {
  return lerp(12, 3, clamp(density, 0, 100) / 100)
}
