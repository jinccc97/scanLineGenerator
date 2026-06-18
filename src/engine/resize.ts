import type { RGBAImage } from './types'

export const PROCESS_WIDTH = 700

/** Downscale a loaded image to the processing width, returning RGBA pixels. */
export function resizeImage(source: HTMLImageElement, targetWidth = PROCESS_WIDTH): RGBAImage {
  const ratio = source.naturalHeight / source.naturalWidth
  const w = Math.max(1, Math.min(targetWidth, source.naturalWidth))
  const h = Math.max(1, Math.round(w * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  ctx.drawImage(source, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}
