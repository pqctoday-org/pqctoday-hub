// SPDX-License-Identifier: AGPL-3.0-only
export const DURATION_CASES = [
  { id: 'baseline', label: 'Baseline sample', hours: ['4', '8', '12'] },
  { id: 'unchanged', label: 'Unchanged sample', hours: ['4', '8', '12'] },
  { id: 'faster', label: 'Faster sample', hours: ['2', '4', '6'] },
  { id: 'slower', label: 'Slower sample', hours: ['6', '12', '18'] },
] as const

export function summarizeRemediationDurations(hours: readonly string[]) {
  let missing = 0
  let invalid = 0
  const values: number[] = []
  for (const raw of hours) {
    const text = raw.trim()
    if (!text) {
      missing++
      continue
    }
    const value = Number(text)
    if (
      !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text) ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      invalid++
      continue
    }
    values.push(value)
  }
  const sum = values.reduce((total, value) => total + value, 0)
  const aggregateInvalid = !Number.isFinite(sum)
  const complete = hours.length > 0 && missing === 0 && invalid === 0 && !aggregateInvalid
  return {
    valid: values.length,
    expected: hours.length,
    missing,
    invalid,
    aggregateInvalid,
    totalHours: complete ? sum : null,
    meanHours: complete ? sum / values.length : null,
  }
}
