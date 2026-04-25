// SPDX-License-Identifier: GPL-3.0-only
import { TIER_LABELS, type StepTierResult } from '../lib/cswp39Tier'

const TIER_STYLES: Record<number, string> = {
  1: 'bg-muted text-muted-foreground border-border',
  2: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  3: 'bg-status-info/15 text-status-info border-status-info/30',
  4: 'bg-status-success/15 text-status-success border-status-success/30',
}

export interface TierBadgeProps {
  result: StepTierResult
}

export function TierBadge({ result }: TierBadgeProps) {
  const style = TIER_STYLES[result.tier] ?? TIER_STYLES[1]
  const tooltip =
    result.reasons.length > 0
      ? `Tier ${result.tier}: ${TIER_LABELS[result.tier]}\n\n${result.reasons.map((r) => `• ${r}`).join('\n')}`
      : `Tier ${result.tier}: ${TIER_LABELS[result.tier]}`

  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${style}`}
      title={tooltip}
    >
      Tier {result.tier} · {TIER_LABELS[result.tier]}
    </span>
  )
}
