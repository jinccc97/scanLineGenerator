import { describe, it, expect } from 'vitest'
import { hatch } from '../src/engine/hatch'
import type { GrayImage } from '../src/engine/types'

function solid(brightness: number, width = 60, height = 60): GrayImage {
  const data = new Float32Array(width * height)
  data.fill(brightness)
  return { width, height, data }
}

describe('hatch', () => {
  it('produces continuous lines independent of brightness (tone is via width)', () => {
    const opts = { lineDirection: 90, density: 50, crossHatch: false }
    const dark = hatch(solid(0), opts)
    const bright = hatch(solid(1), opts)
    expect(dark.main.length).toBe(bright.main.length)
    expect(dark.main.length).toBeGreaterThan(0)
  })

  it('higher density yields more lines', () => {
    const base = { lineDirection: 90, crossHatch: false }
    const sparse = hatch(solid(0.5), { ...base, density: 10 })
    const dense = hatch(solid(0.5), { ...base, density: 90 })
    expect(dense.main.length).toBeGreaterThan(sparse.main.length)
  })

  it('each line is a two-point segment', () => {
    const { main } = hatch(solid(0.5), { lineDirection: 45, density: 50, crossHatch: false })
    expect(main.length).toBeGreaterThan(0)
    expect(main.every((s) => s.points.length === 2)).toBe(true)
  })

  it('cross-hatch adds a perpendicular line set only when enabled', () => {
    const base = { lineDirection: 90, density: 50 }
    expect(hatch(solid(0.5), { ...base, crossHatch: false }).cross).toHaveLength(0)
    expect(hatch(solid(0.5), { ...base, crossHatch: true }).cross.length).toBeGreaterThan(0)
  })
})
