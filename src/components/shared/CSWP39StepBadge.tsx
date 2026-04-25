// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'

export type CSWP39StepId = 'govern' | 'inventory' | 'identify-gaps' | 'prioritise' | 'implement'

const STEP_LABELS: Record<CSWP39StepId, string> = {
  govern: 'Govern',
  inventory: 'Inventory',
  'identify-gaps': 'Identify Gaps',
  prioritise: 'Prioritise',
  implement: 'Implement',
}

const STEP_NUMBERS: Record<CSWP39StepId, number> = {
  govern: 1,
  inventory: 2,
  'identify-gaps': 3,
  prioritise: 4,
  implement: 5,
}

export interface CSWP39StepBadgeProps {
  stepId: CSWP39StepId
  hint?: string
}

export function CSWP39StepBadge({ stepId, hint }: CSWP39StepBadgeProps) {
  const label = STEP_LABELS[stepId]
  const number = STEP_NUMBERS[stepId]
  const tooltip =
    hint ?? `Contributes to CSWP.39 Step ${number} — ${label}. Click to view on Command Center.`

  return (
    <Link
      to={`/business#step-${stepId}`}
      title={tooltip}
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors no-underline"
    >
      CSWP.39 · Step {number} · {label}
    </Link>
  )
}
