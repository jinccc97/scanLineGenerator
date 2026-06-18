import { describe, it, expect } from 'vitest'
import { grayscale } from '../src/engine/grayscale'
import type { RGBAImage } from '../src/engine/types'

function rgba(pixels: number[][]): RGBAImage {
  const data = new Uint8ClampedArray(pixels.length * 4)
  pixels.forEach(([r, g, b], i) => {
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = 255
  })
  return { width: pixels.length, height: 1, data }
}

describe('grayscale', () => {
  it('maps black to 0 and white to 1', () => {
    const out = grayscale(rgba([
      [0, 0, 0],
      [255, 255, 255],
    ]))
    expect(out.data[0]).toBeCloseTo(0, 5)
    expect(out.data[1]).toBeCloseTo(1, 5)
  })

  it('weights green most heavily (luminance)', () => {
    const out = grayscale(rgba([
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ]))
    expect(out.data[0]).toBeCloseTo(0.299, 3)
    expect(out.data[1]).toBeCloseTo(0.587, 3)
    expect(out.data[2]).toBeCloseTo(0.114, 3)
  })
})
