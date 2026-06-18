import type { RGBAImage, Stroke } from './types'
import type { Settings } from '../state'
import { grayscale } from './grayscale'
import { adjustTone } from './adjust'
import { hatch } from './hatch'
import { pitchFor } from './density'
import { modulateWidth } from './roughness'

export type PipelineResult = {
  strokes: Stroke[]
  width: number
  height: number
}

/** Run the geometry pipeline: grayscale -> hatch -> variable-width strokes. */
export function runPipeline(image: RGBAImage, settings: Settings): PipelineResult {
  const gray = adjustTone(grayscale(image), settings.contrast, settings.brightness)
  const pitch = pitchFor(settings.density)
  const { main, cross } = hatch(gray, {
    lineDirection: settings.lineDirection,
    density: settings.density,
    crossHatch: settings.crossHatch,
  })

  const strokes = modulateWidth(main, gray, pitch, settings.lineWidth, settings.roughness, 'main')
  if (cross.length) {
    strokes.push(
      ...modulateWidth(cross, gray, pitch, settings.lineWidth, settings.roughness, 'cross', 2),
    )
  }
  return { strokes, width: gray.width, height: gray.height }
}
