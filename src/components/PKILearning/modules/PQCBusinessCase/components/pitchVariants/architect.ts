// SPDX-License-Identifier: GPL-3.0-only
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { FormData, PitchVariant } from './types'
import {
  buildAlgorithmMigrationsDefault,
  buildCategoryDriversDefault,
  buildCryptoInventoryDefault,
  buildExecutiveSummaryDefault,
  buildGovernanceDefault,
  buildMigrationEffortDefault,
  buildPeerBenchmarkDefault,
  buildPitchObjective,
  buildQuantumUrgencyDefault,
  buildRecommendedActionsDefault,
  buildRiskOverviewDefault,
  buildTimelineDefault,
} from './sectionDefaults'

export function buildArchitectVariant(data: ExecutiveModuleData): PitchVariant {
  const sections: ArtifactSection[] = [
    {
      id: 'tldr',
      title: 'Architecture Summary',
      description: 'One-paragraph framing of the architectural change required.',
      fields: [
        {
          id: 'summary',
          label: 'Architecture Summary',
          type: 'textarea',
          defaultValue: buildExecutiveSummaryDefault(data, 'architect'),
        },
      ],
    },
    {
      id: 'risk-overview',
      title: 'Risk Posture',
      description: 'Current composite risk score including situational boosts.',
      fields: [
        {
          id: 'risks',
          label: 'Risk Posture',
          type: 'textarea',
          defaultValue: buildRiskOverviewDefault(data),
        },
      ],
    },
    {
      id: 'quantum-urgency',
      title: 'HNDL / HNFL — Design Constraints',
      description: 'Time-bound risks that constrain migration sequencing.',
      fields: [
        {
          id: 'urgency',
          label: 'Design Constraints',
          type: 'textarea',
          defaultValue: buildQuantumUrgencyDefault(data),
        },
      ],
    },
    {
      id: 'crypto-inventory',
      title: 'Crypto Inventory — Architecture Detail',
      description: 'Algorithm inventory mapped to infrastructure layers and use cases.',
      fields: [
        {
          id: 'inventory',
          label: 'Crypto Inventory',
          type: 'textarea',
          defaultValue: buildCryptoInventoryDefault(data, 'detail'),
        },
      ],
    },
    {
      id: 'category-drivers',
      title: 'Score Drivers & Architecture Gaps',
      description: 'Per-dimension scores explain where the architecture is weakest.',
      fields: [
        {
          id: 'drivers',
          label: 'Category Drivers',
          type: 'textarea',
          defaultValue: buildCategoryDriversDefault(data),
        },
      ],
    },
    {
      id: 'algorithm-migrations',
      title: 'Algorithm Substitution Matrix',
      description: 'Classical → PQC substitutions with hybrid deployment implications.',
      fields: [
        {
          id: 'migrations',
          label: 'Algorithm Migrations',
          type: 'textarea',
          defaultValue: buildAlgorithmMigrationsDefault(data),
        },
      ],
    },
    {
      id: 'migration-effort',
      title: 'Migration Effort by Algorithm',
      description: 'Complexity and scope inform phase boundaries.',
      fields: [
        {
          id: 'effort',
          label: 'Effort Estimates',
          type: 'textarea',
          defaultValue: buildMigrationEffortDefault(data),
        },
      ],
    },
    {
      id: 'timeline',
      title: 'Architecture Roadmap',
      description: 'Phased architectural rollout from hybrid perimeter through full PQC.',
      fields: [
        {
          id: 'timeline',
          label: 'Roadmap',
          type: 'textarea',
          defaultValue: buildTimelineDefault(data, 'architect'),
        },
      ],
    },
    {
      id: 'governance',
      title: 'Governance — Crypto Review Board',
      description: 'Algorithm approvals, exceptions, and crypto-agility enforcement.',
      fields: [
        {
          id: 'governance',
          label: 'Governance',
          type: 'textarea',
          defaultValue: buildGovernanceDefault(data, 'architect'),
        },
      ],
    },
    {
      id: 'peer-benchmark',
      title: 'Peer Benchmark',
      description: 'Industry and regulatory peer positioning.',
      fields: [
        {
          id: 'benchmark',
          label: 'Peer Benchmark',
          type: 'textarea',
          defaultValue: buildPeerBenchmarkDefault(data),
        },
      ],
    },
    {
      id: 'actions',
      title: 'Recommended Actions',
      description: 'Prioritized architectural next steps.',
      fields: [
        {
          id: 'recommendations',
          label: 'Recommended Actions',
          type: 'textarea',
          defaultValue: buildRecommendedActionsDefault(data, 'architect'),
        },
      ],
    },
  ]

  const renderPreview = (formData: FormData, d: ExecutiveModuleData): string => {
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const get = (sid: string, fid: string) => (formData[sid]?.[fid] as string) || '_Not specified_'

    let md = '# PQC Migration — Architecture Review\n\n'
    md += `**Prepared:** ${dateStr}\n`
    if (d.industry) md += `**Industry:** ${d.industry}\n`
    if (d.country) md += `**Country:** ${d.country}\n`
    md += '**Audience:** Architecture review board + chief architect\n\n---\n\n'

    md += '## 1. Architecture Summary\n\n'
    md += `${get('tldr', 'summary')}\n\n`

    md += '## 2. Risk Posture\n\n'
    md += `${get('risk-overview', 'risks')}\n\n`

    md += '## 3. HNDL / HNFL Design Constraints\n\n'
    md += `${get('quantum-urgency', 'urgency')}\n\n`

    md += '## 4. Crypto Inventory\n\n'
    md += `${get('crypto-inventory', 'inventory')}\n\n`

    md += '## 5. Score Drivers\n\n'
    md += `${get('category-drivers', 'drivers')}\n\n`

    md += '## 6. Algorithm Substitutions\n\n'
    md += `${get('algorithm-migrations', 'migrations')}\n\n`

    md += '## 7. Migration Effort\n\n'
    md += `${get('migration-effort', 'effort')}\n\n`

    md += '## 8. Roadmap\n\n'
    md += `${get('timeline', 'timeline')}\n\n`

    md += '## 9. Governance\n\n'
    md += `${get('governance', 'governance')}\n\n`

    md += '## 10. Peer Benchmark\n\n'
    md += `${get('peer-benchmark', 'benchmark')}\n\n`

    md += '## 11. Recommended Actions\n\n'
    md += `${get('actions', 'recommendations')}\n\n---\n\n`

    md += '*Customized for the Architect role via PQC Today Command Center.*\n'
    return md
  }

  return {
    title: 'PQC Migration — Architecture Review',
    description:
      'An architecture-review-ready brief covering substitutions, patterns, and governance.',
    objective: buildPitchObjective('architect'),
    filename: 'pqc-architecture-review',
    sections,
    renderPreview,
  }
}
