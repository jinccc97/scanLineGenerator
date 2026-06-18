import type { RGBAImage, Stroke } from '../engine/types'
import type { Settings } from '../state'
import { applyTexture } from '../engine/texture'
import { ribbonPolygon } from './ribbon'

/** Add every ribbon outline to the current path. */
function pathRibbons(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  ctx.beginPath()
  for (const stroke of strokes) {
    const poly = ribbonPolygon(stroke)
    if (poly.length < 3) continue
    ctx.moveTo(poly[0].x, poly[0].y)
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y)
    ctx.closePath()
  }
}

function imageToCanvas(src: RGBAImage): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  const cx = c.getContext('2d')
  if (cx) {
    const imgData = cx.createImageData(src.width, src.height)
    imgData.data.set(src.data)
    cx.putImageData(imgData, 0, 0)
  }
  return c
}

/**
 * Draw variable-width strokes as filled ribbons, then overlay texture.
 * In 'photo' color mode the lines act as a mask through which the original
 * image colors show; otherwise they are filled with the single line color.
 */
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  width: number,
  height: number,
  settings: Settings,
  source?: RGBAImage,
): void {
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.fillStyle = settings.background
  ctx.fillRect(0, 0, width, height)

  if (settings.colorMode === 'photo' && source) {
    // Build a line mask, then keep only the photo where the lines are.
    const mask = document.createElement('canvas')
    mask.width = width
    mask.height = height
    const mctx = mask.getContext('2d')
    if (mctx) {
      mctx.fillStyle = '#000'
      pathRibbons(mctx, strokes)
      mctx.fill()
      mctx.globalCompositeOperation = 'source-in'
      mctx.drawImage(imageToCanvas(source), 0, 0, width, height)
      ctx.drawImage(mask, 0, 0)
    }
  } else {
    ctx.fillStyle = settings.color
    pathRibbons(ctx, strokes)
    ctx.fill()
  }

  applyTexture(ctx, width, height, settings.texture)
}
