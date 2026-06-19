import type { RGBAImage } from '../engine/types'
import type { Settings } from '../state'
import { clamp } from '../engine/density'
import { sampleRGB } from '../engine/sample'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function toHex(n: number): string {
  return Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return '#' + toHex(ca[0] + (cb[0] - ca[0]) * t) + toHex(ca[1] + (cb[1] - ca[1]) * t) + toHex(ca[2] + (cb[2] - ca[2]) * t)
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function adjusted(v: number, contrast: number, brightness: number): number {
  const factor = 1 + clamp(contrast, -100, 100) / 100
  const offset = (clamp(brightness, -100, 100) / 100) * 0.5
  return clamp((v - 0.5) * factor + 0.5 + offset, 0, 1)
}

/**
 * Tri-color: blend the line color (mid tones) toward the dark color over dark
 * regions, so dark areas read as a distinct color. Brightness is sampled from
 * the source with the same contrast/brightness adjustment used for tone.
 */
export function triColorAt(settings: Settings, src: RGBAImage, x: number, y: number): string {
  const [r, g, b] = sampleRGB(src, x, y)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const brightness = adjusted(lum, settings.contrast, settings.brightness)
  const darkness = 1 - brightness
  const t = smoothstep(0.45, 0.7, darkness)
  return mixHex(settings.color, settings.darkColor, t)
}
