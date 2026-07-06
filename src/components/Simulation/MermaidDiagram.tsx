// SPDX-License-Identifier: GPL-3.0-only
/**
 * MermaidDiagram — renders a Mermaid source string to inline SVG. Mermaid is a
 * heavy dependency, so it's dynamically imported (kept out of the main bundle)
 * and only loaded when a diagram is actually shown.
 */
import { useEffect, useRef, useState } from 'react'
import { getMermaid } from './mermaidRender'

export function MermaidDiagram({
  source,
  id,
  summary,
}: {
  source: string
  id: string
  /** Plain-text description of the diagram for screen readers (the injected
   *  SVG itself has no text alternative). */
  summary?: string
}) {
  // Keyed by source so a source change shows "Rendering…" until the new SVG
  // arrives — without any synchronous setState in the effect body.
  const [rendered, setRendered] = useState<{ source: string; svg: string } | null>(null)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const [overflowing, setOverflowing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    getMermaid()
      .then((mermaid) => mermaid.render(`mmd-${id}`, source))
      .then(({ svg }) => {
        if (active) setRendered({ source, svg })
      })
      .catch(() => {
        if (active) setFailedSource(source)
      })
    return () => {
      active = false
    }
  }, [source, id])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !rendered || rendered.source !== source) return
    setOverflowing(el.scrollWidth > el.clientWidth + 1)
  }, [rendered, source])

  if (failedSource === source) {
    return (
      <p className="text-xs text-muted-foreground">Diagram couldn’t render — see the list view.</p>
    )
  }
  if (!rendered || rendered.source !== source) {
    return <p className="text-xs text-muted-foreground">Rendering diagram…</p>
  }
  return (
    <div>
      <div
        ref={containerRef}
        role="img"
        aria-label={summary ?? 'Architecture diagram'}
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: rendered.svg }}
      />
      {overflowing && (
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          ← scroll to see the full diagram →
        </p>
      )}
    </div>
  )
}
