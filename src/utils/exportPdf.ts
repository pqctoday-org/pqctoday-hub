// SPDX-License-Identifier: GPL-3.0-only
/**
 * htmlToPdf — capture a rendered HTML element to a multi-page A4 PDF.
 *
 * Uses html2canvas to rasterise the DOM tree, then jsPDF to paginate the
 * resulting canvas across A4 pages. Triggers a browser download.
 *
 * Why not just `window.print()`?
 *   - The drawer markdown viewer is fully styled with theme tokens; print
 *     dialogs render the page chrome, scrollbars, and hover states which
 *     pollute the output.
 *   - jsPDF gives a deterministic, downloaded `.pdf` file with the artifact
 *     title as filename, which is what users expect from a "Download PDF" button.
 *
 * The element is captured as-is — callers should ensure it's visible in the
 * DOM (not display:none) and has a finite width when this is invoked.
 */
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
/** Outer page margin in mm (matches the existing print stylesheet). */
const PAGE_MARGIN_MM = 10

/** Sanitise a candidate filename. Strips path separators, OS-rejected
 *  punctuation, and any C0 control characters. Keeps unicode letters/digits/
 *  dashes/underscores/spaces. */
function sanitiseFilename(name: string): string {
  const cleaned = Array.from(name.normalize('NFC'))
    .filter((ch) => {
      if ('\\/:*?"<>|'.includes(ch)) return false
      const code = ch.charCodeAt(0)
      // Strip C0 controls (0x00-0x1f) and DEL (0x7f).
      if (code < 0x20 || code === 0x7f) return false
      return true
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length > 0 ? cleaned : 'artifact'
}

export interface HtmlToPdfOptions {
  /** Filename for the downloaded PDF (without extension). Defaults to 'artifact'. */
  filename?: string
  /** Pixel ratio passed to html2canvas. Higher = sharper, larger file. Default 2. */
  scale?: number
  /** Background fill, in case the captured element is transparent. Default '#ffffff'. */
  backgroundColor?: string
}

/**
 * Capture an HTML element and download it as an A4 PDF.
 * Resolves once the download has been triggered (jsPDF.save returns synchronously).
 */
export async function htmlToPdf(
  element: HTMLElement,
  options: HtmlToPdfOptions = {}
): Promise<void> {
  const { filename = 'artifact', scale = 2, backgroundColor = '#ffffff' } = options

  // html2canvas only rasterises the visible scroll viewport of any ancestor
  // with overflow:auto/scroll/hidden, clipping tall elements at the bottom.
  // Temporarily override those ancestors so the full content height is captured.
  type Saved = { el: HTMLElement; overflow: string; maxHeight: string }
  const overrides: Saved[] = []
  let node: HTMLElement | null = element.parentElement
  while (node && node !== document.documentElement) {
    const ov = window.getComputedStyle(node).overflowY
    if (ov === 'auto' || ov === 'scroll' || ov === 'hidden') {
      overrides.push({ el: node, overflow: node.style.overflow, maxHeight: node.style.maxHeight })
      node.style.overflow = 'visible'
      node.style.maxHeight = 'none'
    }
    node = node.parentElement
  }

  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      logging: false,
    })
  } finally {
    for (const saved of overrides) {
      saved.el.style.overflow = saved.overflow
      saved.el.style.maxHeight = saved.maxHeight
    }
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const printableWidth = A4_WIDTH_MM - PAGE_MARGIN_MM * 2
  const printableHeight = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2
  // Pixels per mm in our captured canvas, derived from the canvas's width.
  const pxPerMm = canvas.width / printableWidth
  const pageHeightPx = Math.floor(printableHeight * pxPerMm)

  let renderedPx = 0
  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)

    // Slice canvas vertically into a temp canvas matching the slice height.
    const sliceCanvas = globalThis.document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = sliceHeightPx
    const ctx = sliceCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('htmlToPdf: failed to acquire 2D context for canvas slice')
    }
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
    ctx.drawImage(
      canvas,
      0,
      renderedPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    )

    if (renderedPx > 0) pdf.addPage()
    pdf.addImage(
      sliceCanvas.toDataURL('image/png'),
      'PNG',
      PAGE_MARGIN_MM,
      PAGE_MARGIN_MM,
      printableWidth,
      sliceHeightPx / pxPerMm
    )

    renderedPx += sliceHeightPx
  }

  pdf.save(`${sanitiseFilename(filename)}.pdf`)
}
