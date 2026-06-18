import type { RGBAImage } from './types'

function hex2(n: number): string {
  return n.toString(16).padStart(2, '0')
}

/** Sample the original image color at (x, y) as a #rrggbb string. */
export function sampleColorHex(img: RGBAImage, x: number, y: number): string {
  const xi = Math.min(img.width - 1, Math.max(0, Math.floor(x)))
  const yi = Math.min(img.height - 1, Math.max(0, Math.floor(y)))
  const i = (yi * img.width + xi) * 4
  return '#' + hex2(img.data[i]) + hex2(img.data[i + 1]) + hex2(img.data[i + 2])
}
