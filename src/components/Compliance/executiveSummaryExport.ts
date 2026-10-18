// SPDX-License-Identifier: AGPL-3.0-only
import { generateCsv } from '@/utils/csvExport'
import type { ComplianceFramework } from '@/data/complianceData'
import type { ApplicabilityResult, UserProfile } from '@/utils/applicabilityEngine'
import { TIER_META } from '@/utils/applicabilityEngine'

/** Educational applicability worksheet; intentionally separate from operational GRC records. */
export function buildExecutiveSummaryCsv(
  profile: UserProfile,
  frameworks: readonly ApplicabilityResult<ComplianceFramework>[]
): string {
  const generated = new Date().toISOString()
  const preamble = [
    '# PQC Today applicability learning worksheet',
    `# Profile: country=${profile.country ?? 'not set'}; industry=${profile.industry ?? 'not set'}; region=${profile.region ?? 'not set'}`,
    `# Generated: ${generated}`,
    '# Educational use only. This is not legal advice, a GRC record, an applicability decision, or proof of compliance.',
  ]
  const rows = frameworks.map(({ item, tier, reason }) => ({ item, tier, reason }))
  return [
    ...preamble,
    generateCsv(rows, [
      { header: 'Instrument', accessor: (r) => r.item.label },
      { header: 'Applicability tier', accessor: (r) => TIER_META[r.tier].label },
      { header: 'Why included', accessor: (r) => r.reason },
      { header: 'Binding status', accessor: (r) => r.item.bindingStatus ?? 'not reviewed' },
      { header: 'Binding basis', accessor: (r) => r.item.bindingBasis ?? '' },
      {
        header: 'Binding scope',
        accessor: (r) => r.item.bindingScopeEn ?? r.item.bindingScope ?? '',
      },
      { header: 'PQC treatment', accessor: (r) => r.item.pqcRequirement },
      { header: 'Deadline', accessor: (r) => r.item.deadline },
      { header: 'Source', accessor: (r) => r.item.website ?? '' },
      { header: 'Last verified', accessor: (r) => r.item.lastVerified ?? 'not tracked' },
      { header: 'Study prompt: what would you verify?', accessor: () => '' },
      { header: 'Study prompt: which primary passage matters?', accessor: () => '' },
      { header: 'Study prompt: which expert would you consult?', accessor: () => '' },
    ]),
  ].join('\n')
}
