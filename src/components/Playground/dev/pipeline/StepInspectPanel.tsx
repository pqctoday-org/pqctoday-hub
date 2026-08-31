// SPDX-License-Identifier: GPL-3.0-only
/**
 * StepInspectPanel — opt-in real-data view for one PKCS#11 pipeline step,
 * fed by the ###STEP <id> detail### line pipelineCodegen.ts now emits
 * (StepDetail, see pipelineCodegen.ts). Renders alongside, never instead
 * of, the existing summary <pre> — PkcsPipelineBuilder.tsx only mounts
 * this when the user opts into Inspect for that step.
 */
import type { StepDetail } from './pipelineCodegen'
import { CollapsibleValue } from '../../../shared/CollapsibleValue'
import { ErrorDetailPanel } from '../../../shared/ErrorDetailPanel'

export function StepInspectPanel({ detail }: { detail: StepDetail }) {
  if (detail.kind === 'error') {
    return (
      <ErrorDetailPanel
        excType={detail.excType}
        message={detail.message}
        traceback={detail.traceback}
      />
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
