// SPDX-License-Identifier: AGPL-3.0-only
import type { ComplianceSource } from './types'

/**
 * The certification-record source each certification-body row's "Certs" link
 * opens. Records carry their issuing source, not their enforcement body's name
 * (most have no certification body at all), so the link filters by that exact
 * source value. A row with no entry here has no records to link to, and its
 * chip is not shown.
 */
const CERT_RECORD_SOURCE_BY_FRAMEWORK: ReadonlyMap<string, ComplianceSource> = new Map([
  ['FIPS-140-3', 'NIST'],
  ['ACVP', 'NIST'],
  ['COMMON-CRITERIA', 'Common Criteria'],
  ['EUCC', 'ENISA'],
  ['EUCC-V2', 'ENISA'],
  ['ANSSI-CERT', 'ANSSI'],
])

export function certRecordSourceFor(frameworkId: string): ComplianceSource | undefined {
  return CERT_RECORD_SOURCE_BY_FRAMEWORK.get(frameworkId)
}

/** The records-tab link for a certification-body row, or null when it has no records. */
export function certRecordsHref(frameworkId: string): string | null {
  const source = certRecordSourceFor(frameworkId)
  return source ? `/compliance?tab=records&src=${encodeURIComponent(source)}` : null
}
