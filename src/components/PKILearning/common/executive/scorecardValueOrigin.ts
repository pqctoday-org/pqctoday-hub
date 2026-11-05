// SPDX-License-Identifier: AGPL-3.0-only
export type KpiValueSource = 'manual' | 'calculated'
export type KpiValueOrigin =
  | 'not-entered'
  | 'learner-entered'
  | 'learner-override'
  | 'calculated-current'
  | 'calculated-snapshot'
  | 'unrecorded'

export function currentKpiValueOrigin(
  dimension: { valueSource?: KpiValueSource },
  touched: boolean,
  restoredWithoutOrigin = false
): KpiValueOrigin {
  if (restoredWithoutOrigin) return 'unrecorded'
  if (dimension.valueSource === 'manual') return touched ? 'learner-entered' : 'not-entered'
  if (dimension.valueSource === 'calculated')
    return touched ? 'learner-override' : 'calculated-current'
  return 'unrecorded'
}

export function kpiValueOriginLabel(origin: KpiValueOrigin, disabled = false): string {
  if (disabled) return 'Required inputs unavailable'
  const labels: Record<KpiValueOrigin, string> = {
    'not-entered': 'Manual sample input — not entered',
    'learner-entered': 'Learner-entered sample value',
    'learner-override': 'Learner override of calculated sample value',
    'calculated-current': 'Calculated from current selected sample inputs',
    'calculated-snapshot': 'Saved calculated sample snapshot — not a current calculation',
    unrecorded: 'Value origin not recorded',
  }
  return labels[origin]
}
