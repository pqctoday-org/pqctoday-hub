// SPDX-License-Identifier: AGPL-3.0-only

/** Educational record kinds used to keep unlike catalog entries distinct. */
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

const IDS_BY_TYPE: Partial<Record<ThreatRecordType, readonly string[]>> = {
  'implementation vulnerability': ['CROSS-013', 'CROSS-017'],
  'migration constraint': ['CLOUD-004', 'ENERGY-003', 'FIN-005'],
  'policy/deadline signal': [
    'AERO-002',
    'CLOUD-003',
    'CROSS-002',
    'CROSS-007',
    'GOV-002',
    'GOV-003',
    'GOV-005',
    'CROSS-014',
    'FINA-001',
    'CRIT-001',
    'FINA-006',
  ],
  'standards/adoption milestone': [
    'CROSS-006',
    'CROSS-008',
    'FIN-001',
    'IT-002',
    'IT-003',
    'CROSS-011',
    'CROSS-012',
    'CI-001',
    'HEAL-001',
    'FINA-009',
  ],
  'quantum-capability evidence': ['CROSS-004'],
  'educational guidance': [
    'CLOUD-002',
    'TELCO-002',
    'CROS-001',
    'CROS-002',
    'FINA-002',
    'CROS-003',
    'INTE-001',
    'CROS-004',
    'CROS-005',
    'ENER-001',
    'PAYM-001',
    'FINA-003',
    'FINA-004',
    'FINA-005',
    'CROS-006',
    'TELE-001',
    'FINA-007',
    'CROS-007',
    'CROS-008',
    'CROS-009',
    'FINA-008',
    'FINA-010',
    'FINA-011',
  ],
}

const TYPE_BY_ID = new Map<string, ThreatRecordType>(
  Object.entries(IDS_BY_TYPE).flatMap(([type, ids]) =>
    (ids ?? []).map((id) => [id, type as ThreatRecordType] as const)
  )
)

/**
 * This is an explicit editorial classification, not a keyword inference.
 * Unlisted records are threat scenarios; a coverage test requires every
 * published ID to resolve to one of the governed values.
 */
export function threatRecordTypeFor(threatId: string): ThreatRecordType {
  return TYPE_BY_ID.get(threatId) ?? 'threat scenario'
}

export function getThreatRecordType(threat: {
  threatId: string
  recordType?: ThreatRecordType
}): ThreatRecordType {
  return threat.recordType ?? threatRecordTypeFor(threat.threatId)
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
