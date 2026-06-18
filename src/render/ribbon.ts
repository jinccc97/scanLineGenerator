import type { Point, Stroke } from '../engine/types'

/**
 * Build a filled-polygon outline for a variable-width stroke: offset each
 * centerline point by ±width/2 along the local normal, walk one side forward and
 * the other back. Rendering the whole line as a single filled shape avoids the
 * anti-aliasing seams you get from many short butt-capped strokes.
 */
export function ribbonPolygon(stroke: Stroke): Point[] {
  const { points, widths } = stroke
  const n = points.length
  if (n < 2) return []

  const left: Point[] = []
  const right: Point[] = []
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(n - 1, i + 1)]
    let tx = b.x - a.x
    let ty = b.y - a.y
    const len = Math.hypot(tx, ty) || 1
    tx /= len
    ty /= len
    const nx = -ty
    const ny = tx
    const hw = widths[i] / 2
    left.push({ x: points[i].x + nx * hw, y: points[i].y + ny * hw })
    right.push({ x: points[i].x - nx * hw, y: points[i].y - ny * hw })
  }
  right.reverse()
  return left.concat(right)
}

const OVERLAP = 0.4 // px; extend each piece along its tangent to hide seams

/**
 * Split a variable-width stroke into per-segment quads, each with the midpoint
 * where its color should be sampled. Used for photo-color SVG export, where a
 * single line must carry the varying colors underneath it.
 */
export function ribbonQuads(stroke: Stroke): Array<{ quad: Point[]; mx: number; my: number }> {
  const { points, widths } = stroke
  const n = points.length
  const out: Array<{ quad: Point[]; mx: number; my: number }> = []

  for (let i = 0; i < n - 1; i++) {
    const w0 = widths[i] / 2
    const w1 = widths[i + 1] / 2
    if (w0 <= 0 && w1 <= 0) continue

    let tx = points[i + 1].x - points[i].x
    let ty = points[i + 1].y - points[i].y
    const len = Math.hypot(tx, ty) || 1
    tx /= len
    ty /= len
    const nx = -ty
    const ny = tx

    const p0 = { x: points[i].x - tx * OVERLAP, y: points[i].y - ty * OVERLAP }
    const p1 = { x: points[i + 1].x + tx * OVERLAP, y: points[i + 1].y + ty * OVERLAP }

    out.push({
      quad: [
        { x: p0.x + nx * w0, y: p0.y + ny * w0 },
        { x: p1.x + nx * w1, y: p1.y + ny * w1 },
        { x: p1.x - nx * w1, y: p1.y - ny * w1 },
        { x: p0.x - nx * w0, y: p0.y - ny * w0 },
      ],
      mx: (points[i].x + points[i + 1].x) / 2,
      my: (points[i].y + points[i + 1].y) / 2,
    })
  }
  return out
}
