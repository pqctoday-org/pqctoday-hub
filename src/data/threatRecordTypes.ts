// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Educational record kinds used to keep unlike catalog entries distinct. Each
 * threat's kind is the `record_type` column of the threats CSV, set by an editor
 * for every row; no id table or keyword rule lives in code.
 */
export const THREAT_RECORD_TYPES = [
  'threat scenario',
  'implementation vulnerability',
  'migration constraint',
  'policy/deadline signal',
  'standards/adoption milestone',
  'quantum-capability evidence',
  'educational guidance',
] as const

export type ThreatRecordType = (typeof THREAT_RECORD_TYPES)[number]

/**
 * The type the data gives the record. The fallback exists only for test
 * fixtures and records built in code; published rows are checked by
 * `threatAccuracyGuards.test.ts`, which fails on a row without a valid type.
 */
export function getThreatRecordType(threat: { recordType?: ThreatRecordType }): ThreatRecordType {
  return threat.recordType ?? 'threat scenario'
}

export function parseThreatRecordType(value: string | null): ThreatRecordType | null {
  return THREAT_RECORD_TYPES.includes(value as ThreatRecordType)
    ? (value as ThreatRecordType)
    : null
}

export const THREAT_RECORD_TYPE_LABELS: Record<ThreatRecordType, string> = {
  'threat scenario': 'Threat scenario',
  'implementation vulnerability': 'Implementation vulnerability',
  'migration constraint': 'Migration constraint',
  'policy/deadline signal': 'Policy / deadline signal',
  'standards/adoption milestone': 'Standards / adoption milestone',
  'quantum-capability evidence': 'Quantum-capability evidence',
  'educational guidance': 'Educational guidance',
}
