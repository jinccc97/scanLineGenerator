import type { GrayImage } from './types'
import { clamp } from './density'

/**
 * Adjust the brightness map's contrast and brightness before hatching.
 * contrast/brightness are -100..100 (0 = no change). Contrast pivots around
 * mid-gray; brightness shifts the whole range.
 */
export function adjustTone(gray: GrayImage, contrast: number, brightness: number): GrayImage {
  const factor = 1 + clamp(contrast, -100, 100) / 100 // 0..2
  const offset = (clamp(brightness, -100, 100) / 100) * 0.5 // -0.5..0.5

  if (factor === 1 && offset === 0) return gray

  const out = new Float32Array(gray.data.length)
  for (let i = 0; i < gray.data.length; i++) {
    out[i] = clamp((gray.data[i] - 0.5) * factor + 0.5 + offset, 0, 1)
  }
  return { width: gray.width, height: gray.height, data: out }
}
