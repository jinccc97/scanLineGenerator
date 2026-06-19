import type { RGBAImage } from '../engine/types'
import type { Settings } from '../state'
import { computeLithoLayers, type LithoLayer } from '../engine/litho'
import { applyTexture } from '../engine/texture'
import { hashNoise } from '../engine/noise'
import { clamp } from '../engine/density'

function newCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** Draw one ink layer to its own canvas, then composite (optionally blurred). */
function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: LithoLayer,
  sw: number,
  sh: number,
  scale: number,
  blur: number,
): void {
  const off = newCanvas(sw, sh)
  const octx = off.getContext('2d')
  if (!octx) return
  octx.fillStyle = layer.hex
  for (const d of layer.dots) {
    octx.beginPath()
    octx.arc((d.x + layer.offset.dx) * scale, (d.y + layer.offset.dy) * scale, d.r * scale, 0, Math.PI * 2)
    octx.fill()
  }
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  if (blur > 0) ctx.filter = `blur(${blur}px)`
  ctx.drawImage(off, 0, 0)
  ctx.restore()
}

/** Scatter ink specks across the image (ink splatter). */
function drawSplatter(
  ctx: CanvasRenderingContext2D,
  layers: LithoLayer[],
  sw: number,
  sh: number,
  roughness: number,
): void {
  if (roughness <= 0 || layers.length === 0) return
  const count = Math.floor((roughness / 100) * (sw * sh) / 9000)
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  for (let i = 0; i < count; i++) {
    const x = hashNoise(i, 1, 11) * sw
    const y = hashNoise(i, 2, 12) * sh
    const r = 0.5 + hashNoise(i, 3, 13) * 1.8
    ctx.fillStyle = layers[i % layers.length].hex
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Low-frequency paper-colored wash to simulate uneven fading / desaturation. */
function applyFade(
  ctx: CanvasRenderingContext2D,
  paper: string,
  sw: number,
  sh: number,
  texture: number,
): void {
  const amount = (clamp(texture, 0, 100) / 100) * 0.22
  if (amount <= 0) return
  const cw = Math.max(2, Math.ceil(sw / 40))
  const ch = Math.max(2, Math.ceil(sh / 40))
  const small = newCanvas(cw, ch)
  const sctx = small.getContext('2d')
  if (!sctx) return
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      sctx.fillStyle = paper
      sctx.globalAlpha = hashNoise(x, y, 21) * amount
      sctx.fillRect(x, y, 1, 1)
    }
  }
  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.globalAlpha = 1
  ctx.drawImage(small, 0, 0, sw, sh)
  ctx.restore()
}

/**
 * Render the risograph (litho) look: paper, overprinted halftone ink layers,
 * registration offsets, ink splatter, fading, and paper grain.
 */
export function renderLitho(
  ctx: CanvasRenderingContext2D,
  src: RGBAImage,
  width: number,
  height: number,
  settings: Settings,
  scale: number,
): void {
  const sw = Math.round(width * scale)
  const sh = Math.round(height * scale)
  const { layers, paper } = computeLithoLayers(src, settings)

  ctx.fillStyle = paper
  ctx.fillRect(0, 0, sw, sh)

  const blur = 0.3 * scale // scan smudge
  for (const layer of layers) drawLayer(ctx, layer, sw, sh, scale, blur)

  drawSplatter(ctx, layers, sw, sh, settings.roughness)
  applyFade(ctx, paper, sw, sh, settings.texture)
  applyTexture(ctx, sw, sh, settings.texture)
}
