import { describe, it, expect } from 'vitest'
import { lerp, clamp, pitchFor } from '../src/engine/density'

describe('density', () => {
  it('lerp interpolates endpoints', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(0, 10, 0.5)).toBe(5)
  })

  it('clamp bounds values', () => {
    expect(clamp(-5, 0, 100)).toBe(0)
    expect(clamp(150, 0, 100)).toBe(100)
    expect(clamp(50, 0, 100)).toBe(50)
  })

  it('higher density yields a smaller pitch (more lines)', () => {
    expect(pitchFor(0)).toBeGreaterThan(pitchFor(100))
    expect(pitchFor(100)).toBeGreaterThan(0)
  })
})
