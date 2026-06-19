import type { RGBAImage, Stroke } from '../engine/types'
import type { Settings } from '../state'
import { applyTexture } from '../engine/texture'
import { ribbonPolygon, ribbonQuads } from './ribbon'
import { renderLitho } from './litho'
import { triColorAt } from './tricolor'

/** Add every ribbon outline to the current path (in logical coordinates). */
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
 * Draw variable-width strokes as filled ribbons, then overlay texture. `scale`
 * re-renders the same vector geometry at a higher pixel resolution for crisp,
 * larger output (1 = preview size). In 'photo' color mode the lines act as a
 * mask through which the original image colors show.
 */
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  width: number,
  height: number,
  settings: Settings,
  source?: RGBAImage,
  scale = 1,
): void {
  const sw = Math.round(width * scale)
  const sh = Math.round(height * scale)
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  if (settings.colorMode === 'litho' && source) {
    renderLitho(ctx, source, width, height, settings, scale)
    return
  }

  ctx.fillStyle = settings.background
  ctx.fillRect(0, 0, sw, sh)

  if (settings.colorMode === 'tri' && source) {
    // Per-segment quads colored by local darkness (line color -> dark color).
    ctx.save()
    ctx.scale(scale, scale)
    for (const stroke of strokes) {
      for (const { quad, mx, my } of ribbonQuads(stroke)) {
        ctx.fillStyle = triColorAt(settings, source, mx, my)
        ctx.beginPath()
        ctx.moveTo(quad[0].x, quad[0].y)
        for (let i = 1; i < quad.length; i++) ctx.lineTo(quad[i].x, quad[i].y)
        ctx.closePath()
        ctx.fill()
      }
    }
    ctx.restore()
    applyTexture(ctx, sw, sh, settings.texture)
    return
  }

  if (settings.colorMode === 'photo' && source) {
    // Build a line mask at full resolution, then keep only the photo where lines are.
    const mask = document.createElement('canvas')
    mask.width = sw
    mask.height = sh
    const mctx = mask.getContext('2d')
    if (mctx) {
      mctx.scale(scale, scale)
      mctx.fillStyle = '#000'
      pathRibbons(mctx, strokes)
      mctx.fill()
      mctx.setTransform(1, 0, 0, 1, 0, 0)
      mctx.globalCompositeOperation = 'source-in'
      mctx.drawImage(imageToCanvas(source), 0, 0, sw, sh)
      ctx.drawImage(mask, 0, 0)
    }
  } else {
    ctx.save()
    ctx.scale(scale, scale)
    ctx.fillStyle = settings.color
    pathRibbons(ctx, strokes)
    ctx.fill()
    ctx.restore()
  }

  applyTexture(ctx, sw, sh, settings.texture)
}
