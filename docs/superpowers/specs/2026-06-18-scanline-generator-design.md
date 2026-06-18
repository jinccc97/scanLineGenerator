# Scanline Style Generator — Design Spec

**Date:** 2026-06-18
**Status:** Approved (design phase)

## Overview

A browser-based web app that converts an uploaded photo into a scanline / hatch-line
art style, with live controls and PNG/SVG export. Built as a single-page app with a
pure-Canvas processing pipeline (no OpenCV.js, no Paper.js).

## Scope (this iteration)

In scope:
- Image upload (drag-and-drop + file picker)
- Pipeline: grayscale → resize → density map → hatch render → roughness → texture → color
- Controls: lineWidth, lineDirection, density, roughness, texture, crossHatch, color, background
- 5 color presets
- Export: PNG, SVG
- Cross-hatch (Phase 2-1): extra perpendicular lines in dark regions

Out of scope (future iterations):
- PDF export
- Adaptive direction (Sobel gradient), edge preservation (Canny), region segmentation
- Style engine presets (Woodcut, Engraving, Blueprint, etc.)
- AI style transfer

## Tech Stack

- Vite + TypeScript
- Pure HTML/CSS for UI (no framework)
- Canvas 2D for processing, preview, and PNG export
- Hand-built SVG string serialization for SVG export
- Vitest for engine unit tests

Rationale: grayscale and resize are native Canvas operations, so OpenCV.js (multi-MB
WASM) is unnecessary. SVG is generated directly from the segment array, lighter than
Paper.js. Minimal dependencies → fast load and simple deploy.

## Architecture

Pure-function pipeline. Each engine module takes an input and returns the next stage's
input, independently testable.

```
src/
  main.ts                 Entry point, state + render orchestration
  state.ts                Settings type + defaults + presets
  engine/
    grayscale.ts          ImageData → brightness array (Float, 0~1)
    resize.ts             uploaded image → processing resolution downsample
    density.ts            brightness → line spacing map
    hatch.ts              spacing map → line segments[] (direction / cross-hatch)
    roughness.ts          jitter segment coords (value-noise based)
    texture.ts            procedural paper/canvas texture overlay (no image assets)
    pipeline.ts           run(settings, source) chaining the stages
  render/
    canvas.ts             segments[] → draw on Canvas (preview)
  export/
    png.ts                Canvas → PNG Blob download
    svg.ts                segments[] → SVG string download
  ui/
    controls.ts           slider / color / preset panel (DOM)
    preview.ts            preview + debounced re-render
```

## Data Flow

upload → `resize` (downscale original to ~600px processing width) → `grayscale`
(brightness array) → `density` (per-pixel spacing) → `hatch` (line segment array — the
shared intermediate representation for both SVG and PNG) → `roughness` (jitter segment
points) → render (Canvas) / export (SVG uses segments directly). Texture is an overlay
layer drawn on top of the Canvas.

## Settings Type

```ts
type Settings = {
  lineWidth: number     // 1~10, stroke width (px)
  lineDirection: number // 0~180, rotation angle (deg)
  density: number       // 0~100, overall line density (spacing range)
  roughness: number     // 0~100, coordinate jitter strength
  texture: number       // 0~100, texture overlay opacity
  crossHatch: boolean   // perpendicular lines in dark regions
  color: string         // line color, e.g. "#1f3b5f"
  background: string    // background color, e.g. "#f5f2ea"
}
```

## Engine Algorithms

### grayscale.ts
Standard luminance: `0.299*R + 0.587*G + 0.114*B`, normalized to 0~1.
Output: `Float32Array` of length `width * height`.

### resize.ts
Draw source image onto an offscreen canvas scaled to a fixed processing width
(~600px), preserving aspect ratio. Returns `ImageData`.

### density.ts
Brightness → spacing. The `density` slider scales the spacing range:
- `maxSpacing = lerp(8, 30, 1 - density/100)`
- `minSpacing = 2`
- per pixel: `spacing = lerp(minSpacing, maxSpacing, brightness)` (brighter → wider)

### hatch.ts
Scan in a rotated coordinate frame. Conceptually rotate the image by `lineDirection`,
lay parallel lines at a base interval, and walk along each line: draw where the local
region is denser (low brightness / small spacing) and skip across bright regions (large
spacing), producing tonal variation. Output: array of `{x1, y1, x2, y2}` segments.

Cross-hatch: when enabled, for dark pixels (`brightness < 0.4`) add a perpendicular
(+90°) secondary segment to deepen the print-like look.

### roughness.ts
Split each segment into multiple points, then displace coordinates using seeded value
noise. `0` = straight lines (mechanical), `100` = large jitter (woodcut). Uses a seeded
noise function (not `Math.random`) so re-renders are stable and reproducible.

### texture.ts
Procedurally generate a paper/canvas grain via noise; composite over the drawing using
Canvas `globalCompositeOperation: "multiply"`, with opacity driven by the `texture`
value. No external image assets.

## UI / Layout

Two-column: left control panel + right preview. Responsive — stacks vertically on
mobile.

Control panel:
- Image upload (drag-and-drop + file picker)
- 5 sliders: lineWidth, lineDirection, density, roughness, texture (with live value labels)
- crossHatch toggle
- 2 color pickers: line color / background color
- 5 preset buttons
- Export buttons: PNG / SVG

Re-render: slider input is debounced ~120ms before re-running the pipeline. One
immediate render right after upload.

## Presets

| Preset      | Line       | Background |
|-------------|------------|------------|
| Indigo      | `#1f3b5f`  | `#f5f2ea`  |
| Charcoal    | `#2b2b2b`  | `#ededed`  |
| Sepia       | `#5c4327`  | `#f3e9d2`  |
| Forest      | `#24433a`  | `#eef2e6`  |
| Terracotta  | `#9c4722`  | `#f6ece3`  |

A preset sets line/background colors (and may set baseline parameters).

## Export

- PNG: render the preview canvas at processing resolution (optionally 2x scale),
  `toBlob` → download.
- SVG: serialize the segment array to `<line>` (or `<polyline>` when roughness adds
  intermediate points), include a background `<rect>` → download.

## Testing

Unit tests (Vitest) on the pure engine functions:
- grayscale luminance computation
- density lerp boundary values (brightness 0 and 1)
- hatch segment generation count / behavior
- svg serialization output

UI / Canvas rendering verified manually.

## Default Settings

```ts
const DEFAULTS: Settings = {
  lineWidth: 1,
  lineDirection: 90,
  density: 50,
  roughness: 20,
  texture: 30,
  crossHatch: false,
  color: "#1f3b5f",
  background: "#f5f2ea",
}
```
