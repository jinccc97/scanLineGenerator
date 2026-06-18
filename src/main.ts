import { DEFAULTS, type Settings } from './state'
import { resizeImage } from './engine/resize'
import { runPipeline, type PipelineResult } from './engine/pipeline'
import { renderToCanvas } from './render/canvas'
import { exportPNG } from './export/png'
import { exportSVG } from './export/svg'
import { createControls } from './ui/controls'
import type { RGBAImage } from './engine/types'

const controlsEl = document.getElementById('controls') as HTMLElement
const stageEl = document.getElementById('stage') as HTMLElement
const dropzone = document.getElementById('dropzone') as HTMLElement
const canvas = document.getElementById('canvas') as HTMLCanvasElement

const settings: Settings = { ...DEFAULTS }
let sourceImage: RGBAImage | null = null
let lastResult: PipelineResult | null = null
let debounceTimer: number | undefined

function render(): void {
  if (!sourceImage) return
  lastResult = runPipeline(sourceImage, settings)
  renderToCanvas(canvas, lastResult.strokes, lastResult.width, lastResult.height, settings, sourceImage)
  canvas.hidden = false
  dropzone.hidden = true
}

function scheduleRender(): void {
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(render, 120)
}

function loadFile(file: File): void {
  if (!file.type.startsWith('image/')) return
  const img = new Image()
  img.onload = () => {
    sourceImage = resizeImage(img)
    URL.revokeObjectURL(img.src)
    render()
  }
  img.src = URL.createObjectURL(file)
}

createControls(controlsEl, settings, {
  onChange: scheduleRender,
  onUpload: loadFile,
  onExportPNG: (scale: number) => {
    if (!sourceImage || !lastResult) return
    if (scale === 1) {
      exportPNG(canvas, 'scanline.png')
      return
    }
    // Re-render the vector geometry at higher resolution for crisp output.
    const hi = document.createElement('canvas')
    renderToCanvas(hi, lastResult.strokes, lastResult.width, lastResult.height, settings, sourceImage, scale)
    exportPNG(hi, `scanline@${scale}x.png`)
  },
  onExportSVG: () => {
    if (lastResult) {
      exportSVG(lastResult.strokes, lastResult.width, lastResult.height, settings, sourceImage ?? undefined)
    }
  },
})

// Drag & drop onto the stage.
stageEl.addEventListener('dragover', (e) => {
  e.preventDefault()
  stageEl.classList.add('drag-over')
})
stageEl.addEventListener('dragleave', () => stageEl.classList.remove('drag-over'))
stageEl.addEventListener('drop', (e) => {
  e.preventDefault()
  stageEl.classList.remove('drag-over')
  const file = e.dataTransfer?.files?.[0]
  if (file) loadFile(file)
})
dropzone.addEventListener('click', () => {
  const input = controlsEl.querySelector<HTMLInputElement>('.file-input')
  input?.click()
})
