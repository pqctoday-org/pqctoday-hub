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
  dimension: { valueSource?: KpiValueSource; disabled?: boolean },
  touched: boolean,
  restoredWithoutOrigin = false
): KpiValueOrigin {
  if (restoredWithoutOrigin || dimension.disabled) return 'unrecorded'
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

/** Restoring a calculation does not establish a match to today's selected inputs. */
export function restoredKpiValueOrigins(
  scores: Record<string, number> | undefined,
  origins: Record<string, KpiValueOrigin> | undefined
): Record<string, KpiValueOrigin> {
  return Object.fromEntries(
    Object.keys(scores ?? {}).map((id) => {
      const origin = origins?.[id]
      return [
        id,
        origin === 'calculated-current' || origin === 'calculated-snapshot'
          ? 'calculated-snapshot'
          : origin === 'learner-entered' ||
              origin === 'learner-override' ||
              origin === 'not-entered'
            ? origin
            : 'unrecorded',
      ]
    })
  )
}

export function isKpiValueAssessed(origin: KpiValueOrigin): boolean {
  return (
    origin === 'learner-entered' || origin === 'learner-override' || origin === 'calculated-current'
  )
}
