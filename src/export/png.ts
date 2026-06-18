import { download } from './download'

/** Export the rendered canvas as a PNG file. */
export function exportPNG(canvas: HTMLCanvasElement, filename = 'scanline.png'): void {
  canvas.toBlob((blob) => {
    if (blob) download(blob, filename)
  }, 'image/png')
}
