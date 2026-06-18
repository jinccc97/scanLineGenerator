import { hashNoise } from './noise'

/**
 * Procedural paper/canvas grain composited over the drawing with `multiply`.
 * `amount` is 0..100; higher = stronger grain. No external image assets.
 */
export function applyTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  seed = 7,
): void {
  if (amount <= 0) return

  const off = document.createElement('canvas')
  off.width = width
  off.height = height
  const octx = off.getContext('2d')
  if (!octx) return

  const id = octx.createImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Combine two scales for a paper-like grain.
      const fine = hashNoise(x, y, seed)
      const coarse = hashNoise(x >> 1, y >> 1, seed + 31)
      const g = 0.6 * fine + 0.4 * coarse
      const v = 200 + g * 55 // light grain (200..255) so multiply darkens gently
      const i = (y * width + x) * 4
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v
      id.data[i + 3] = 255
    }
  }
  octx.putImageData(id, 0, 0)

  ctx.save()
  ctx.globalAlpha = (Math.min(100, amount) / 100) * 0.6
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(off, 0, 0)
  ctx.restore()
}
