import type { RGBAImage, Stroke } from '../engine/types'
import type { Settings } from '../state'
import { ribbonPolygon, ribbonQuads } from '../render/ribbon'
import { sampleColorHex } from '../engine/sample'
import { computeLithoLayers } from '../engine/litho'
import { triColorAt } from '../render/tricolor'
import { download } from './download'

function f(n: number): string {
  return Math.round(n * 10) / 10 + ''
}

function polygonTag(points: { x: number; y: number }[], fill?: string): string {
  const pts = points.map((p) => `${f(p.x)},${f(p.y)}`).join(' ')
  const attr = fill ? ` fill="${fill}"` : ''
  return `<polygon points="${pts}"${attr}/>`
}

/** Serialize the risograph halftone (vector dots, overprinted). Raster grain
 *  and splatter are omitted (they are not vector). */
function buildLithoSVG(source: RGBAImage, width: number, height: number, settings: Settings): string {
  const { layers, paper } = computeLithoLayers(source, settings)
  const groups = layers
    .map((layer) => {
      const circles = layer.dots
        .map(
          (d) =>
            `<circle cx="${f(d.x + layer.offset.dx)}" cy="${f(d.y + layer.offset.dy)}" r="${f(d.r)}"/>`,
        )
        .join('\n')
      return `<g fill="${layer.hex}" style="mix-blend-mode:multiply">\n${circles}\n</g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="${paper}"/>
${groups}
</svg>`
}

/** Serialize variable-width strokes into an SVG document (filled ribbons). */
export function buildSVG(
  strokes: Stroke[],
  width: number,
  height: number,
  settings: Settings,
  source?: RGBAImage,
): string {
  if (settings.colorMode === 'litho' && source) {
    return buildLithoSVG(source, width, height, settings)
  }

  const photo = settings.colorMode === 'photo' && !!source
  const tri = settings.colorMode === 'tri' && !!source

  let body: string
  let groupAttr: string
  if (photo && source) {
    body = strokes
      .flatMap((s) => ribbonQuads(s).map((q) => polygonTag(q.quad, sampleColorHex(source, q.mx, q.my))))
      .join('\n')
    groupAttr = 'stroke="none"'
  } else if (tri && source) {
    body = strokes
      .flatMap((s) => ribbonQuads(s).map((q) => polygonTag(q.quad, triColorAt(settings, source, q.mx, q.my))))
      .join('\n')
    groupAttr = 'stroke="none"'
  } else {
    body = strokes
      .map((s) => {
        const poly = ribbonPolygon(s)
        return poly.length < 3 ? '' : polygonTag(poly)
      })
      .filter(Boolean)
      .join('\n')
    groupAttr = `fill="${settings.color}" stroke="none"`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="${settings.background}"/>
<g ${groupAttr}>
${body}
</g>
</svg>`
}

/** Export strokes as an SVG file. */
export function exportSVG(
  strokes: Stroke[],
  width: number,
  height: number,
  settings: Settings,
  source?: RGBAImage,
  filename = 'scanline.svg',
): void {
  const svg = buildSVG(strokes, width, height, settings, source)
  download(new Blob([svg], { type: 'image/svg+xml' }), filename)
}
