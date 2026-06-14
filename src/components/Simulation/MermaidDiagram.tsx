// SPDX-License-Identifier: GPL-3.0-only
/**
 * MermaidDiagram — renders a Mermaid source string to inline SVG. Mermaid is a
 * heavy dependency, so it's dynamically imported (kept out of the main bundle)
 * and only loaded when a diagram is actually shown.
 */
import { useEffect, useState } from 'react'

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null
async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      m.default.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })
      return m.default
    })
  }
  return mermaidPromise
}

export function MermaidDiagram({ source, id }: { source: string; id: string }) {
  // Keyed by source so a source change shows "Rendering…" until the new SVG
  // arrives — without any synchronous setState in the effect body.
  const [rendered, setRendered] = useState<{ source: string; svg: string } | null>(null)
  const [failedSource, setFailedSource] = useState<string | null>(null)

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

  if (failedSource === source) {
    return (
      <p className="text-xs text-muted-foreground">Diagram couldn’t render — see the list view.</p>
    )
  }
  if (!rendered || rendered.source !== source) {
    return <p className="text-xs text-muted-foreground">Rendering diagram…</p>
  }
  return <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: rendered.svg }} />
}
