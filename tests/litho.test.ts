import { describe, it, expect } from 'vitest'
import { computeLithoLayers, pickInks } from '../src/engine/litho'
import { DEFAULTS } from '../src/state'
import type { RGBAImage } from '../src/engine/types'

function solidRGBA(r: number, g: number, b: number, width = 80, height = 80): RGBAImage {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = 255
  }
  return { width, height, data }
}

const litho = (overrides = {}) => ({ ...DEFAULTS, colorMode: 'litho' as const, ...overrides })

describe('pickInks', () => {
  it('caps selection at 4 and drops invalid keys', () => {
    const out = pickInks(['black', 'red', 'yellow', 'teal', 'cobalt'] as never)
    expect(out).toHaveLength(4)
  })

  it('falls back to defaults when empty', () => {
    expect(pickInks([]).length).toBeGreaterThan(0)
  })
})

describe('computeLithoLayers', () => {
  it('creates one layer per selected ink', () => {
    const res = computeLithoLayers(solidRGBA(128, 128, 128), litho({ inks: ['black', 'cobalt'] }))
    expect(res.layers).toHaveLength(2)
  })

  it('produces no dots over pure white (highlight = paper)', () => {
    const res = computeLithoLayers(solidRGBA(255, 255, 255), litho({ inks: ['black'] }))
    const dots = res.layers.reduce((sum, l) => sum + l.dots.length, 0)
    expect(dots).toBe(0)
  })

  it('produces large dots over black and smaller over mid-gray', () => {
    const black = computeLithoLayers(solidRGBA(0, 0, 0), litho({ inks: ['black'] }))
    const grayMid = computeLithoLayers(solidRGBA(120, 120, 120), litho({ inks: ['black'] }))
    const maxR = (r: ReturnType<typeof computeLithoLayers>) =>
      Math.max(...r.layers[0].dots.map((d) => d.r), 0)
    expect(maxR(black)).toBeGreaterThan(maxR(grayMid))
  })

  it('offsets non-base layers (plate misregistration)', () => {
    const res = computeLithoLayers(solidRGBA(80, 80, 80), litho({ inks: ['black', 'red'], roughness: 100 }))
    expect(res.layers[0].offset).toEqual({ dx: 0, dy: 0 })
    const o = res.layers[1].offset
    expect(Math.hypot(o.dx, o.dy)).toBeGreaterThan(0)
  })
})
