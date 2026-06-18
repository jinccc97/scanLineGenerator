export type Point = { x: number; y: number }

/** Geometry from the hatch stage. Two points = a straight, continuous line. */
export type Segment = { points: Point[] }

/** Hatch output: primary lines plus optional cross-hatch lines. */
export type HatchResult = { main: Segment[]; cross: Segment[] }

/** A renderable variable-width line: a centerline with a width (px) per point. */
export type Stroke = { points: Point[]; widths: number[] }

/** Minimal RGBA image shape. Browser ImageData is structurally assignable. */
export type RGBAImage = { width: number; height: number; data: Uint8ClampedArray }

/** Per-pixel brightness, 0 (black) .. 1 (white). */
export type GrayImage = { width: number; height: number; data: Float32Array }
