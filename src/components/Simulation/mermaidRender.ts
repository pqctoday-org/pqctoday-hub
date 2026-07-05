// SPDX-License-Identifier: GPL-3.0-only
/**
 * Mermaid loading + rasterisation helpers shared by MermaidDiagram (inline
 * SVG preview) and any caller that needs a PNG (e.g. embedding a live diagram
 * in a jsPDF export, which has no native SVG support). Split out of
 * MermaidDiagram.tsx so that file can stay component-only for Fast Refresh.
 */

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

/** Lazily import + initialise mermaid once, cached for the module's lifetime. */
export async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        // 'strict' sanitises labels (via DOMPurify) rather than trusting
        // them — some callers (e.g. CryptoArchitectureDiagram) build labels
        // from user-typed component names, so this is real defense, not a
        // formality.
        securityLevel: 'strict',
        // Default htmlLabels renders text via <foreignObject><span>, which
        // taints any canvas it's drawn onto ("Tainted canvases may not be
        // exported") — breaking PNG rasterisation for PDF export. Plain SVG
        // <text> labels avoid that entirely and cost nothing here since none
        // of our labels need HTML-level formatting. (The nested
        // `flowchart.htmlLabels` variant is deprecated in favour of this
        // top-level key.)
        htmlLabels: false,
      })
      return m.default
    })
  }
  return mermaidPromise
}

/** Extract the diagram's logical size from its rendered SVG — prefer the
 *  `viewBox` (mermaid always sets one) over `width`/`height`, which are often
 *  `"100%"` and unusable for sizing. Falls back to a reasonable default so a
 *  malformed SVG still produces *something* rather than throwing. */
function svgLogicalSize(svg: string): { width: number; height: number } {
  const viewBox = svg.match(/viewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/)
  if (viewBox) return { width: parseFloat(viewBox[1]), height: parseFloat(viewBox[2]) }
  // No viewBox — fall back to explicit width/height attributes, ignoring
  // whatever unit suffix follows the number (px, %, ...).
  const w = svg.match(/\swidth="(\d+\.?\d*)/)
  const h = svg.match(/\sheight="(\d+\.?\d*)/)
  return { width: w ? parseFloat(w[1]) : 800, height: h ? parseFloat(h[1]) : 400 }
}

/**
 * Render Mermaid source to a PNG data URL, for embedding in a PDF (jsPDF has
 * no native SVG support). Reuses the same lazily-loaded `mermaid` module as
 * the live preview, so this costs nothing extra once a preview has been shown
 * once on the page.
 *
 * `width`/`height` in the result are the diagram's logical (viewBox) size in
 * CSS pixels — use these for page-fit layout math. The PNG itself is
 * rasterised at `scale`x that size for print sharpness.
 */
export async function renderMermaidToPngDataUrl(
  source: string,
  { scale = 2, background = '#ffffff' }: { scale?: number; background?: string } = {}
): Promise<{ dataUrl: string; width: number; height: number }> {
  const mermaid = await getMermaid()
  const { svg } = await mermaid.render(
    `mmd-export-${Math.random().toString(36).slice(2, 9)}`,
    source
  )
  const { width, height } = svgLogicalSize(svg)

  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Failed to load diagram SVG for PNG export'))
      el.src = svgUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return { dataUrl: canvas.toDataURL('image/png'), width, height }
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
