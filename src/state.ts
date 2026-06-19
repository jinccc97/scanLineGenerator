import { DEFAULT_INKS, type InkKey } from './engine/inks'

export type ColorMode = 'duo' | 'tri' | 'photo' | 'litho'

export type Settings = {
  lineWidth: number // 1..10, stroke width (px)
  lineDirection: number // 0..180, rotation angle (deg)
  density: number // 0..100, overall line density
  roughness: number // 0..100, coordinate jitter strength
  texture: number // 0..100, texture overlay opacity
  crossHatch: boolean // perpendicular lines in dark regions
  contrast: number // -100..100, source contrast adjustment
  brightness: number // -100..100, source brightness adjustment
  colorMode: ColorMode // 'duo' = line+bg, 'tri' = +dark color, 'photo' = original, 'litho' = riso
  inks: InkKey[] // selected risograph inks (litho mode, max 4)
  color: string // line color (duo / tri mid tone)
  darkColor: string // color used for dark regions (tri mode)
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
  darkColor: '#0c1c30',
  background: '#f5f2ea',
}

export type Preset = { name: string; color: string; darkColor: string; background: string }

export const PRESETS: Preset[] = [
  { name: 'Indigo', color: '#1f3b5f', darkColor: '#0c1c30', background: '#f5f2ea' },
  { name: 'Charcoal', color: '#2b2b2b', darkColor: '#000000', background: '#ededed' },
  { name: 'Sepia', color: '#5c4327', darkColor: '#2e1f10', background: '#f3e9d2' },
  { name: 'Forest', color: '#24433a', darkColor: '#0e211b', background: '#eef2e6' },
  { name: 'Terracotta', color: '#9c4722', darkColor: '#4d1d0d', background: '#f6ece3' },
]
