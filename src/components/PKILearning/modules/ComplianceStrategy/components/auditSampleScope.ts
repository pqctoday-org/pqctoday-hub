// SPDX-License-Identifier: AGPL-3.0-only
/** Fictional records for learning scope comparison; no real certificate is represented. */
export const AUDIT_SAMPLE_REQUIREMENT = {
  module: 'Example Crypto',
  version: '2.1',
  platform: 'Linux test platform',
  date: '2026-11-16',
}
export const AUDIT_SAMPLE_RECORDS = [
  {
    id: 'matching',
    label: 'Record A',
    module: 'Example Crypto',
    version: '2.1',
    platform: 'Linux test platform',
    validThrough: '2027-11-16',
  },
  {
    id: 'version',
    label: 'Record B',
    module: 'Example Crypto',
    version: '2.0',
    platform: 'Linux test platform',
    validThrough: '2027-11-16',
  },
  {
    id: 'platform',
    label: 'Record C',
    module: 'Example Crypto',
    version: '2.1',
    platform: 'Windows test platform',
    validThrough: '2027-11-16',
  },
  {
    id: 'expired',
    label: 'Record D',
    module: 'Example Crypto',
    version: '2.1',
    platform: 'Linux test platform',
    validThrough: '2026-10-16',
  },
] as const
export function compareAuditSampleScope(record: (typeof AUDIT_SAMPLE_RECORDS)[number]): string[] {
  const gaps: string[] = []
  if (record.module !== AUDIT_SAMPLE_REQUIREMENT.module) gaps.push('Module identity differs.')
  if (record.version !== AUDIT_SAMPLE_REQUIREMENT.version)
    gaps.push('The record covers another module version.')
  if (record.platform !== AUDIT_SAMPLE_REQUIREMENT.platform)
    gaps.push('The record covers another platform.')
  if (record.validThrough < AUDIT_SAMPLE_REQUIREMENT.date)
    gaps.push('The sample record expired before the review date.')
  return gaps
}
