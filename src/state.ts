import { DEFAULT_INKS, type InkKey } from './engine/inks'

export type ColorMode = 'duo' | 'photo' | 'litho'

export type Settings = {
  lineWidth: number // 1..10, stroke width (px)
  lineDirection: number // 0..180, rotation angle (deg)
  density: number // 0..100, overall line density
  roughness: number // 0..100, coordinate jitter strength
  texture: number // 0..100, texture overlay opacity
  crossHatch: boolean // perpendicular lines in dark regions
  contrast: number // -100..100, source contrast adjustment
  brightness: number // -100..100, source brightness adjustment
  colorMode: ColorMode // 'duo' = line+bg, 'photo' = original colors, 'litho' = risograph
  inks: InkKey[] // selected risograph inks (litho mode, max 4)
  color: string // line color (duo mode)
  background: string // background / paper color
}

export const DEFAULTS: Settings = {
  lineWidth: 2,
  lineDirection: 90,
  density: 50,
  roughness: 20,
  texture: 30,
  crossHatch: false,
  contrast: 0,
  brightness: 0,
  colorMode: 'duo',
  inks: [...DEFAULT_INKS],
  color: '#1f3b5f',
  background: '#f5f2ea',
}

export type Preset = { name: string; color: string; background: string }

export const PRESETS: Preset[] = [
  { name: 'Indigo', color: '#1f3b5f', background: '#f5f2ea' },
  { name: 'Charcoal', color: '#2b2b2b', background: '#ededed' },
  { name: 'Sepia', color: '#5c4327', background: '#f3e9d2' },
  { name: 'Forest', color: '#24433a', background: '#eef2e6' },
  { name: 'Terracotta', color: '#9c4722', background: '#f6ece3' },
]
