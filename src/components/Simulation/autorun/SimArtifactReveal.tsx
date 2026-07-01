// SPDX-License-Identifier: GPL-3.0-only
import { FileText } from 'lucide-react'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { revealText } from './revealText'

/**
 * SimArtifactReveal — a brief "document ready · what it is" card shown during the
 * Executive Overview walkthrough when a board document is generated at a deep stage
 * (charter, budget/ROI, board deck, risk register, roadmap, KPI pack, verification).
 * The line is sourced from the matching business tool; renders nothing when idle.
 */
export function SimArtifactReveal({ type }: { type: ExecutiveDocumentType | null }) {
  if (!type) return null
  const r = revealText(type)
  if (!r) return null
  return (
    <div
      className="pointer-events-auto fixed bottom-24 right-4 z-[55] max-w-xs rounded-lg border border-secondary/40 bg-card/95 p-3 shadow-lg backdrop-blur"
      data-testid="artifact-reveal"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <FileText size={13} className="shrink-0 text-secondary" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-secondary">
          Document ready · {r.title}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{r.body}</p>
    </div>
  )
}
