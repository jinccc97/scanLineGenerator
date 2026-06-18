/** Deterministic hash noise in [0, 1] for an integer-ish (x, y, seed). */
export function hashNoise(x: number, y: number, seed: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = h ^ (h >>> 16)
  return (h >>> 0) / 4294967295
}

/** Deterministic hash noise in [-1, 1]. */
export function signedNoise(x: number, y: number, seed: number): number {
  return hashNoise(x, y, seed) * 2 - 1
}

/**
 * Smooth (low-frequency) value noise in [-1, 1]. Samples a lattice spaced by
 * `scale` px and smoothstep-interpolates, so nearby points vary gently rather
 * than jumping per-pixel.
 */
export function smoothNoise(x: number, y: number, scale: number, seed: number): number {
  const sx = x / scale
  const sy = y / scale
  const x0 = Math.floor(sx)
  const y0 = Math.floor(sy)
  const fx = sx - x0
  const fy = sy - y0
  const wx = fx * fx * (3 - 2 * fx)
  const wy = fy * fy * (3 - 2 * fy)

  const n00 = hashNoise(x0, y0, seed)
  const n10 = hashNoise(x0 + 1, y0, seed)
  const n01 = hashNoise(x0, y0 + 1, seed)
  const n11 = hashNoise(x0 + 1, y0 + 1, seed)

  const a = n00 + (n10 - n00) * wx
  const b = n01 + (n11 - n01) * wx
  return (a + (b - a) * wy) * 2 - 1
}
