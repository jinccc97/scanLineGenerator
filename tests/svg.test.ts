import { describe, it, expect } from 'vitest'
import { buildSVG } from '../src/export/svg'
import { DEFAULTS } from '../src/state'
import type { Stroke } from '../src/engine/types'

describe('buildSVG', () => {
  const settings = { ...DEFAULTS, color: '#123456', background: '#abcdef' }

  it('emits a background rect and a fill group with the settings colors', () => {
    const svg = buildSVG([], 100, 80, settings)
    expect(svg).toContain('viewBox="0 0 100 80"')
    expect(svg).toContain('fill="#abcdef"')
    expect(svg).toContain('fill="#123456"')
  })

  it('serializes a stroke as a filled <polygon>', () => {
    const strokes: Stroke[] = [
      { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], widths: [2, 2] },
    ]
    const svg = buildSVG(strokes, 20, 20, settings)
    expect(svg).toContain('<polygon points="')
  })

  it('skips degenerate strokes', () => {
    const strokes: Stroke[] = [{ points: [{ x: 0, y: 0 }], widths: [2] }]
    const svg = buildSVG(strokes, 20, 20, settings)
    expect(svg).not.toContain('<polygon')
  })

  it('uses the dark color over dark regions in tri mode', () => {
    const triSettings = {
      ...DEFAULTS,
      colorMode: 'tri' as const,
      color: '#ffffff',
      darkColor: '#ff0000',
    }
    // single black pixel -> darkness high -> dark color
    const source = { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 255]) }
    const strokes: Stroke[] = [{ points: [{ x: 0, y: 0 }, { x: 0.9, y: 0 }], widths: [2, 2] }]
    const svg = buildSVG(strokes, 1, 1, triSettings, source)
    expect(svg).toContain('fill="#ff0000"')
  })

  it('colors polygons from the source image in photo mode', () => {
    const photoSettings = { ...DEFAULTS, colorMode: 'photo' as const, background: '#ffffff' }
    // 2x1 image: left pixel red, right pixel green.
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255])
    const source = { width: 2, height: 1, data }
    const strokes: Stroke[] = [
      { points: [{ x: 0, y: 0 }, { x: 1.9, y: 0 }], widths: [2, 2] },
    ]
    const svg = buildSVG(strokes, 2, 1, photoSettings, source)
    expect(svg).toContain('fill="#ff0000"')
  })
})
