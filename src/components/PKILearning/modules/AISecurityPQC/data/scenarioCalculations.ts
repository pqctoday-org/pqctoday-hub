// SPDX-License-Identifier: AGPL-3.0-only
/** Pure calculations for the module's authored samples; no cryptographic execution. */
export function relativeChangePercent(baseline: number, selected: number): number | null {
  if (!Number.isFinite(baseline) || !Number.isFinite(selected) || baseline <= 0 || selected < 0)
    return null
  return ((selected - baseline) / baseline) * 100
}

export function formatRelativeChange(baseline: number, selected: number): string {
  const change = relativeChangePercent(baseline, selected)
  if (change === null) return 'Not defined for this baseline'
  if (change === 0) return 'No change (0%)'
  return `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(0)}%`
}

/** The existing teaching bands are <5%, 5–<15%, and >=15%; not acceptance limits. */
export function commerceOverheadBand(percent: number | null): string {
  if (percent === null) return 'Not assessed'
  if (percent < 5) return 'Acceptable'
  if (percent < 15) return 'Moderate'
  return 'Significant'
}
