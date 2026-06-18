import { describe, it, expect } from 'vitest'
import { adjustTone } from '../src/engine/adjust'
import type { GrayImage } from '../src/engine/types'

function gray(values: number[]): GrayImage {
  return { width: values.length, height: 1, data: Float32Array.from(values) }
}

describe('adjustTone', () => {
  it('returns the same image when contrast and brightness are 0', () => {
    const g = gray([0.2, 0.5, 0.8])
    expect(adjustTone(g, 0, 0)).toBe(g)
  })

  it('positive contrast pushes values away from mid-gray', () => {
    const out = adjustTone(gray([0.25, 0.75]), 50, 0)
    expect(out.data[0]).toBeLessThan(0.25)
    expect(out.data[1]).toBeGreaterThan(0.75)
  })

  it('negative contrast pulls values toward mid-gray', () => {
    const out = adjustTone(gray([0.0, 1.0]), -50, 0)
    expect(out.data[0]).toBeGreaterThan(0.0)
    expect(out.data[1]).toBeLessThan(1.0)
  })

  it('brightness shifts values and clamps to [0,1]', () => {
    const out = adjustTone(gray([0.5, 0.9]), 0, 50)
    expect(out.data[0]).toBeCloseTo(0.75, 5)
    expect(out.data[1]).toBe(1)
  })
})
