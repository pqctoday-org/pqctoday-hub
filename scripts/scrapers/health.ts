/* eslint-disable security/detect-object-injection */
import { ComplianceRecord } from './types.js'

export interface HealthCheckResult {
  source: string
  status: 'healthy' | 'warning' | 'critical'
  recordCount: number
  previousCount?: number
  message?: string
}

// Minimum expected records per source (baseline from historical runs)
const EXPECTED_MINIMUMS: Record<string, number> = {
  NIST: 100,
  ACVP: 50,
  'Common Criteria': 200,
  ANSSI: 20,
  ENISA: 5,
}

export const validateRecordCounts = (
  records: ComplianceRecord[],
  previousRecords: ComplianceRecord[]
): HealthCheckResult[] => {
  const results: HealthCheckResult[] = []

  // Group by source
  const bySource = records.reduce(
    (acc, r) => {
      const key = r.source
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const prevBySource = previousRecords.reduce(
    (acc, r) => {
      const key = r.source
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Check each source in the new data
  for (const [source, count] of Object.entries(bySource)) {
    const prevCount = prevBySource[source] || 0
    const expected = EXPECTED_MINIMUMS[source] || 10

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    let message = ''

    // Critical: 50%+ drop
    if (prevCount > 0 && count / prevCount < 0.5) {
      status = 'critical'
      message = `Record count dropped 50%+: ${prevCount} → ${count}`
    } else if (count < expected) {
      // Warning: Below expected minimum
      status = 'warning'
      message = `Below expected minimum (${expected}): got ${count}`
    }

    results.push({
      source,
      status,
      recordCount: count,
      previousCount: prevCount,
      message,
    })
  }

  // Check for missing sources that were expected
  for (const source of Object.keys(EXPECTED_MINIMUMS)) {
    if (!bySource[source] && prevBySource[source]) {
      results.push({
        source,
        status: 'critical',
        recordCount: 0,
        previousCount: prevBySource[source] || 0,
        message: 'Source returned 0 records (was present before)',
      })
    }
  }

  return results
}

export const logHealthChecks = (results: HealthCheckResult[]): boolean => {
  console.log('\n[Health Check] Results:')
  let hasFailures = false

  for (const result of results) {
    const icon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '🔴'
    console.log(`  ${icon} ${result.source}: ${result.recordCount} records`)
    if (result.message) {
      console.log(`     └─ ${result.message}`)
    }
    if (result.status === 'critical') {
      hasFailures = true
    }
  }

  return hasFailures
}
