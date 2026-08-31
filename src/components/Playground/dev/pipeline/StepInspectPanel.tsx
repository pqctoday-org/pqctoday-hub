// SPDX-License-Identifier: GPL-3.0-only
/**
 * StepInspectPanel — opt-in real-data view for one PKCS#11 pipeline step,
 * fed by the ###STEP <id> detail### line pipelineCodegen.ts now emits
 * (StepDetail, see pipelineCodegen.ts). Renders alongside, never instead
 * of, the existing summary <pre> — PkcsPipelineBuilder.tsx only mounts
 * this when the user opts into Inspect for that step.
 */
import { useState } from 'react'
import type { StepDetail } from './pipelineCodegen'
import { CollapsibleValue } from '../../../shared/CollapsibleValue'

export function StepInspectPanel({ detail }: { detail: StepDetail }) {
  const [tbExpanded, setTbExpanded] = useState(false)

  if (detail.kind === 'error') {
    return (
      <div className="mt-2 ml-1 pl-2 border-l-2 border-destructive/40 bg-muted/30 rounded-r-lg p-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          Error detail
        </p>
        <p className="text-xs font-mono text-status-error mb-1.5">
          {detail.excType}: {detail.message}
        </p>
        <div
          role="button"
          tabIndex={0}
          className="text-[11px] select-none cursor-pointer hover:underline text-muted-foreground"
          onClick={() => setTbExpanded(!tbExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setTbExpanded(!tbExpanded)
            }
          }}
        >
          <span className="text-[9px] opacity-70 mr-1">{tbExpanded ? '▼' : '▶'}</span>
          {tbExpanded ? 'Hide traceback' : 'Show full traceback'}
        </div>
        {tbExpanded && (
          <pre className="mt-1.5 p-2 bg-background/50 rounded border border-border/30 max-h-56 overflow-auto text-[10px] leading-relaxed whitespace-pre-wrap select-text">
            {detail.traceback}
          </pre>
        )}
      </div>
    )
  }

  if (!detail.fields.length) return null

  return (
    <div className="mt-2 ml-1 pl-2 border-l-2 border-primary/30 bg-muted/30 rounded-r-lg p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        Real output
      </p>
      <div className="space-y-1">
        {detail.fields.map((f, i) => (
          <div key={i} className="flex gap-3 text-xs font-mono">
            <span className="text-muted-foreground w-28 shrink-0">{f.name}</span>
            <div className="flex-1 min-w-0">
              <CollapsibleValue value={f.hex} isOutput showModeToggle />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
