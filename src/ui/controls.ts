import { DEFAULTS, PRESETS, type ColorMode, type Settings } from '../state'
import { INK_ORDER, LITHO_INKS, MAX_INKS } from '../engine/inks'

export type ControlHandlers = {
  onChange: (settings: Settings) => void
  onUpload: (file: File) => void
  onExportPNG: (scale: number) => void
  onExportSVG: () => void
}

const EXPORT_SCALES = [1, 2, 3]

type SliderSpec = {
  key: keyof Settings
  label: string
  min: number
  max: number
  step: number
}

const LINE_SLIDERS: SliderSpec[] = [
  { key: 'lineWidth', label: '선 두께', min: 0.5, max: 10, step: 0.5 },
  { key: 'lineDirection', label: '방향 (°)', min: 0, max: 180, step: 1 },
  { key: 'density', label: '밀도', min: 0, max: 100, step: 1 },
  { key: 'roughness', label: '거칠기 (선 굵기 변화)', min: 0, max: 100, step: 1 },
  { key: 'texture', label: '텍스처', min: 0, max: 100, step: 1 },
]

const IMAGE_SLIDERS: SliderSpec[] = [
  { key: 'contrast', label: '대비', min: -100, max: 100, step: 1 },
  { key: 'brightness', label: '명도', min: -100, max: 100, step: 1 },
]

const DIRECTION_PRESETS = [0, 45, 90]

/** Build the control panel and wire it to the live settings object. */
export function createControls(
  container: HTMLElement,
  settings: Settings,
  handlers: ControlHandlers,
): { refresh: () => void } {
  container.innerHTML = ''
  const refreshers: Array<() => void> = []

  // --- Upload ---
  const uploadSection = section('이미지')
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.className = 'file-input'
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file) handlers.onUpload(file)
  })
  const uploadBtn = document.createElement('button')
  uploadBtn.className = 'btn'
  uploadBtn.textContent = '이미지 선택'
  uploadBtn.addEventListener('click', () => fileInput.click())
  uploadSection.append(uploadBtn, fileInput)
  container.append(uploadSection)

  // Build one slider row; returns its sync fn so presets can update it too.
  const addSlider = (parent: HTMLElement, spec: SliderSpec): (() => void) => {
    const row = document.createElement('div')
    row.className = 'control-row'

    const label = document.createElement('label')
    label.textContent = spec.label

    const value = document.createElement('span')
    value.className = 'value'

    const reset = document.createElement('button')
    reset.className = 'reset-btn'
    reset.title = '초기화'
    reset.textContent = '↺'

    const input = document.createElement('input')
    input.type = 'range'
    input.min = String(spec.min)
    input.max = String(spec.max)
    input.step = String(spec.step)

    const defaultValue = DEFAULTS[spec.key] as number
    const sync = () => {
      const v = settings[spec.key] as number
      input.value = String(v)
      value.textContent = String(v)
      reset.style.visibility = v === defaultValue ? 'hidden' : 'visible'
    }
    sync()
    refreshers.push(sync)

    input.addEventListener('input', () => {
      ;(settings[spec.key] as number) = Number(input.value)
      sync()
      handlers.onChange(settings)
    })

    reset.addEventListener('click', () => {
      ;(settings[spec.key] as number) = defaultValue
      sync()
      handlers.onChange(settings)
    })

    const head = document.createElement('div')
    head.className = 'control-head'
    const right = document.createElement('div')
    right.className = 'control-right'
    right.append(value, reset)
    head.append(label, right)
    row.append(head, input)

    // Quick direction presets under the direction slider.
    if (spec.key === 'lineDirection') {
      const presetRow = document.createElement('div')
      presetRow.className = 'mini-presets'
      for (const deg of DIRECTION_PRESETS) {
        const btn = document.createElement('button')
        btn.className = 'mini-preset'
        btn.textContent = `${deg}°`
        btn.addEventListener('click', () => {
          settings.lineDirection = deg
          sync()
          handlers.onChange(settings)
        })
        presetRow.append(btn)
      }
      row.append(presetRow)
    }

    parent.append(row)
    return sync
  }

  // --- Line sliders ---
  const adjustSection = section('조절값')
  for (const spec of LINE_SLIDERS) addSlider(adjustSection, spec)

  // --- Cross-hatch toggle ---
  const toggleRow = document.createElement('label')
  toggleRow.className = 'toggle-row'
  const toggle = document.createElement('input')
  toggle.type = 'checkbox'
  const toggleSync = () => {
    toggle.checked = settings.crossHatch
  }
  toggleSync()
  refreshers.push(toggleSync)
  toggle.addEventListener('change', () => {
    settings.crossHatch = toggle.checked
    handlers.onChange(settings)
  })
  const toggleText = document.createElement('span')
  toggleText.textContent = '크로스해치 (어두운 영역 교차선)'
  toggleRow.append(toggle, toggleText)
  adjustSection.append(toggleRow)
  container.append(adjustSection)

  // --- Source adjustments ---
  const imageSection = section('원본 보정')
  for (const spec of IMAGE_SLIDERS) addSlider(imageSection, spec)
  container.append(imageSection)

  // --- Colors ---
  const colorSection = section('색상')

  // Mode tabs.
  const tabs = document.createElement('div')
  tabs.className = 'tabs'
  const tabDefs: Array<{ mode: ColorMode; label: string }> = [
    { mode: 'duo', label: '2색' },
    { mode: 'photo', label: '사진 색상' },
    { mode: 'litho', label: '리소' },
  ]
  const tabButtons = tabDefs.map(({ mode, label }) => {
    const btn = document.createElement('button')
    btn.className = 'tab'
    btn.textContent = label
    btn.addEventListener('click', () => {
      settings.colorMode = mode
      refresh()
      handlers.onChange(settings)
    })
    tabs.append(btn)
    return { mode, btn }
  })
  colorSection.append(tabs)

  const lineColor = colorPicker('선 색', settings.color, (v) => {
    settings.color = v
    handlers.onChange(settings)
  })
  const bgColor = colorPicker('배경/종이 색', settings.background, (v) => {
    settings.background = v
    handlers.onChange(settings)
  })

  // Ink checkboxes (litho mode, max 4).
  const inkGroup = document.createElement('div')
  inkGroup.className = 'ink-group'
  const inkLabel = document.createElement('div')
  inkLabel.className = 'sub-label'
  inkGroup.append(inkLabel)
  const inkBoxes = INK_ORDER.map((key) => {
    const item = document.createElement('label')
    item.className = 'ink-item'
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    const swatch = document.createElement('span')
    swatch.className = 'ink-swatch'
    swatch.style.background = LITHO_INKS[key].hex
    const text = document.createElement('span')
    text.textContent = LITHO_INKS[key].name
    item.append(cb, swatch, text)
    cb.addEventListener('change', () => {
      const set = new Set(settings.inks)
      if (cb.checked) set.add(key)
      else set.delete(key)
      settings.inks = INK_ORDER.filter((k) => set.has(k))
      refresh()
      handlers.onChange(settings)
    })
    inkGroup.append(item)
    return { key, cb }
  })

  refreshers.push(() => {
    lineColor.input.value = settings.color
    bgColor.input.value = settings.background
    const mode = settings.colorMode
    lineColor.row.style.display = mode === 'duo' ? '' : 'none'
    inkGroup.style.display = mode === 'litho' ? '' : 'none'
    const atMax = settings.inks.length >= MAX_INKS
    inkLabel.textContent = `잉크 (최대 ${MAX_INKS}개) · ${settings.inks.length}/${MAX_INKS}`
    inkBoxes.forEach(({ key, cb }) => {
      cb.checked = settings.inks.includes(key)
      cb.disabled = !cb.checked && atMax
    })
    tabButtons.forEach(({ mode: m, btn }) => btn.classList.toggle('active', mode === m))
  })
  colorSection.append(lineColor.row, inkGroup, bgColor.row)
  container.append(colorSection)

  // --- Presets ---
  const presetSection = section('프리셋')
  const presetGrid = document.createElement('div')
  presetGrid.className = 'preset-grid'
  for (const preset of PRESETS) {
    const btn = document.createElement('button')
    btn.className = 'preset-btn'
    btn.textContent = preset.name
    btn.style.setProperty('--line', preset.color)
    btn.style.setProperty('--bg', preset.background)
    btn.addEventListener('click', () => {
      settings.color = preset.color
      settings.background = preset.background
      refresh()
      handlers.onChange(settings)
    })
    presetGrid.append(btn)
  }
  presetSection.append(presetGrid)
  container.append(presetSection)

  // --- Export ---
  const exportSection = section('내보내기')

  // PNG resolution scale (re-renders vectors at higher resolution).
  let exportScale = 1
  const scaleLabel = document.createElement('div')
  scaleLabel.className = 'sub-label'
  scaleLabel.textContent = 'PNG 해상도'
  const scaleTabs = document.createElement('div')
  scaleTabs.className = 'tabs'
  const scaleButtons = EXPORT_SCALES.map((s) => {
    const btn = document.createElement('button')
    btn.className = 'tab' + (s === exportScale ? ' active' : '')
    btn.textContent = `${s}x`
    btn.addEventListener('click', () => {
      exportScale = s
      scaleButtons.forEach(({ scale, el }) => el.classList.toggle('active', scale === exportScale))
    })
    scaleTabs.append(btn)
    return { scale: s, el: btn }
  })
  exportSection.append(scaleLabel, scaleTabs)

  const exportRow = document.createElement('div')
  exportRow.className = 'export-row'
  const pngBtn = document.createElement('button')
  pngBtn.className = 'btn btn-primary'
  pngBtn.textContent = 'PNG'
  pngBtn.addEventListener('click', () => handlers.onExportPNG(exportScale))
  const svgBtn = document.createElement('button')
  svgBtn.className = 'btn btn-primary'
  svgBtn.textContent = 'SVG'
  svgBtn.addEventListener('click', handlers.onExportSVG)
  exportRow.append(pngBtn, svgBtn)
  exportSection.append(exportRow)
  container.append(exportSection)

  const refresh = () => refreshers.forEach((fn) => fn())
  refresh() // initialize tab/visibility state
  return { refresh }
}

function section(title: string): HTMLElement {
  const el = document.createElement('section')
  el.className = 'panel-section'
  const h = document.createElement('h2')
  h.textContent = title
  el.append(h)
  return el
}

function colorPicker(
  label: string,
  initial: string,
  onChange: (value: string) => void,
): { row: HTMLElement; input: HTMLInputElement } {
  const row = document.createElement('div')
  row.className = 'color-row'
  const span = document.createElement('span')
  span.textContent = label
  const input = document.createElement('input')
  input.type = 'color'
  input.value = initial
  input.addEventListener('input', () => onChange(input.value))
  row.append(span, input)
  return { row, input }
}
