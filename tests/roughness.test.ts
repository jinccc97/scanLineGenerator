import { describe, it, expect } from 'vitest'
import { modulateWidth } from '../src/engine/roughness'
import type { GrayImage, Segment } from '../src/engine/types'

const line: Segment[] = [{ points: [{ x: 0, y: 0 }, { x: 40, y: 0 }] }]
const PITCH = 8

function solidGray(brightness: number, width = 64, height = 4): GrayImage {
  const data = new Float32Array(width * height)
  data.fill(brightness)
  return { width, height, data }
}

const mid = (s: { widths: number[] }) => s.widths[Math.floor(s.widths.length / 2)]

describe('modulateWidth', () => {
  it('returns one stroke per line with a width per point', () => {
    const out = modulateWidth(line, solidGray(0.5), PITCH, 2, 0)
    expect(out).toHaveLength(1)
    expect(out[0].widths).toHaveLength(out[0].points.length)
  })

  it('makes dark areas thicker than light areas', () => {
    const dark = modulateWidth(line, solidGray(0), PITCH, 2, 0)
    const light = modulateWidth(line, solidGray(1), PITCH, 2, 0)
    expect(mid(dark[0])).toBeGreaterThan(mid(light[0]))
  })

  it('dark strokes thicken past the pitch (merge into solid tone)', () => {
    const dark = modulateWidth(line, solidGray(0), PITCH, 2, 0)
    expect(mid(dark[0])).toBeGreaterThan(PITCH)
  })

  it('cross-hatch fades to zero width over light areas', () => {
    const out = modulateWidth(line, solidGray(1), PITCH, 2, 0, 'cross')
    expect(out[0].widths.every((w) => w === 0)).toBe(true)
  })

  it('cross-hatch keeps width over dark areas', () => {
    const out = modulateWidth(line, solidGray(0), PITCH, 2, 0, 'cross')
    expect(mid(out[0])).toBeGreaterThan(0)
  })

  it('is deterministic for the same seed', () => {
    const a = modulateWidth(line, solidGray(0.4), PITCH, 2, 80, 'main', 42)
    const b = modulateWidth(line, solidGray(0.4), PITCH, 2, 80, 'main', 42)
    expect(a).toEqual(b)
  })

  it('keeps lines straight (no positional jitter)', () => {
    const out = modulateWidth(line, solidGray(0.5), PITCH, 2, 100)
    expect(out[0].points.every((p) => p.y === 0)).toBe(true)
  })
})
