// SPDX-License-Identifier: GPL-3.0-only
import type { ForceClusterNode } from '@/data/forceClusterGraph'
import { GRAPH_TOKEN, TYPE_LABEL } from './graphVisuals'

interface TourCaptionProps {
  node: ForceClusterNode
  /** True while the tour has also opened NavigateDetailPanel (right-hand, w-[340px]) for this same node — shifts the caption left so the two don't overlap, rather than trying to keep it dead-centered over a panel that's covering part of the scene. */
  panelOpen: boolean
}

/**
 * Slim lower-third readout shown once the tour's camera arrives at a node
 * stop. The tour also opens the full NavigateDetailPanel for the same node
 * (confirmed 2026-08-29, revising the initial "caption only" choice) — this
 * stays as a quick at-a-glance strip even with the fuller panel open.
 */
export function TourCaption({ node, panelOpen }: TourCaptionProps) {
  const token = GRAPH_TOKEN[node.type]
  return (
    <div
      className={`pointer-events-none absolute bottom-4 left-4 z-10 flex justify-center ${panelOpen ? 'right-[372px]' : 'right-4'}`}
    >
      <div
        className="glass-panel pointer-events-auto w-[min(92vw,480px)] space-y-1 p-3 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: `hsl(var(${token.varName}))` }}
            aria-hidden="true"
          />
          {TYPE_LABEL[node.type]} · {node.degree} connection{node.degree === 1 ? '' : 's'}
        </div>
        <p className="text-sm font-medium text-foreground">{node.label}</p>
        {node.description && (
          <p className="truncate text-xs text-muted-foreground">{node.description}</p>
        )}
      </div>
    </div>
  )
}
