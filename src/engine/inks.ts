/** Classic risograph ink palette. Highlights use no ink (paper shows through). */
export type InkKey = 'fluor-pink' | 'red' | 'yellow' | 'teal' | 'cobalt' | 'black' | 'forest'

export const LITHO_INKS: Record<InkKey, { name: string; hex: string }> = {
  'fluor-pink': { name: '형광 핑크', hex: '#ff48b0' },
  red: { name: '레드', hex: '#ff665e' },
  yellow: { name: '옐로우', hex: '#ffe800' },
  teal: { name: '틸', hex: '#00838a' },
  cobalt: { name: '코발트 블루', hex: '#2e54a1' },
  black: { name: '블랙', hex: '#161616' },
  forest: { name: '포레스트 그린', hex: '#2c6b43' },
}

export const INK_ORDER: InkKey[] = ['fluor-pink', 'red', 'yellow', 'teal', 'cobalt', 'forest', 'black']

export const DEFAULT_INKS: InkKey[] = ['black', 'fluor-pink', 'cobalt', 'yellow']

export const MAX_INKS = 4
