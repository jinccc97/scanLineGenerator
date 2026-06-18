import type { GrayImage, RGBAImage } from './types'

/** Convert RGBA pixels to a normalized brightness map (0..1) via luminance. */
export function grayscale(img: RGBAImage): GrayImage {
  const { width, height, data } = img
  const out = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    out[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }
  return { width, height, data: out }
}
