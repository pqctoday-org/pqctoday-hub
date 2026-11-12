// SPDX-License-Identifier: AGPL-3.0-only
/** Recorded date coverage describes metadata, not independent review or freshness. */
export interface RecordedDateCoverage {
  totalRows: number
  datedRows: number
  missingRows: number
  invalidRows: number
  oldestDate?: string
  newestDate?: string
}

export function recordedDateCoverage(
  values: readonly (string | null | undefined)[]
): RecordedDateCoverage {
  const dates: string[] = []
  let missingRows = 0
  let invalidRows = 0
  for (const value of values) {
    const date = value?.trim()
    if (!date) {
      missingRows += 1
      continue
    }
    const parsed = new Date(`${date}T00:00:00Z`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      invalidRows += 1
      continue
    }
    dates.push(date)
  }
  dates.sort()
  return {
    totalRows: values.length,
    datedRows: dates.length,
    missingRows,
    invalidRows,
    oldestDate: dates[0],
    newestDate: dates.at(-1),
  }
}

export function recordedDateCoveragePhrase(label: string, coverage: RecordedDateCoverage): string {
  const range =
    coverage.oldestDate && coverage.newestDate
      ? `${coverage.oldestDate}–${coverage.newestDate}`
      : 'no date range available'
  return `${label}: ${coverage.datedRows}/${coverage.totalRows} dated rows (${range}); ${coverage.missingRows} missing, ${coverage.invalidRows} invalid`
}
