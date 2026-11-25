// SPDX-License-Identifier: AGPL-3.0-only
import { getFrameworkById } from '@/data/complianceData'
import type { ComplianceSource } from './types'

/**
 * The certification-record source each certification-body row's "Certs" link
 * opens. Records carry their issuing source, not their enforcement body's name
 * (most have no certification body at all), so the link filters by that exact
 * source value. The source is the row's `cert_record_source` cell in the compliance
 * catalogue; a row with none has no records to link to, and its chip is not shown.
 */
export function certRecordSourceFor(frameworkId: string): ComplianceSource | undefined {
  return getFrameworkById(frameworkId)?.certRecordSource as ComplianceSource | undefined
}

/** The records-tab link for a certification-body row, or null when it has no records. */
export function certRecordsHref(frameworkId: string): string | null {
  const source = certRecordSourceFor(frameworkId)
  return source ? `/compliance?tab=records&src=${encodeURIComponent(source)}` : null
}
