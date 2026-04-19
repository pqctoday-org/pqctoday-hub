// SPDX-License-Identifier: GPL-3.0-only
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { FormData, PitchVariant } from './types'
import {
  buildAlgorithmMigrationsDefault,
  buildCategoryDriversDefault,
  buildCryptoInventoryDefault,
  buildExecutiveSummaryDefault,
  buildMigrationEffortDefault,
  buildPitchObjective,
  buildQuantumUrgencyDefault,
  buildRecommendedActionsDefault,
  buildRiskOverviewDefault,
  buildTimelineDefault,
} from './sectionDefaults'

export function buildDeveloperVariant(data: ExecutiveModuleData): PitchVariant {
  const sections: ArtifactSection[] = [
    {
      id: 'tldr',
      title: 'TL;DR — Engineering Ask',
      description: 'One-paragraph framing for the engineering team.',
      fields: [
        {
          id: 'summary',
          label: 'Engineering Summary',
          type: 'textarea',
          defaultValue: buildExecutiveSummaryDefault(data, 'developer'),
        },
      ],
    },
    {
      id: 'risk-overview',
      title: 'Risk Posture',
      description: 'Current quantum-risk score with boost context.',
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
      title: 'HNDL / HNFL — Time Pressure',
      description: 'Why the migration clock is ticking, with windows quantified.',
      fields: [
        {
          id: 'urgency',
          label: 'Time-Bound Risks',
          type: 'textarea',
          defaultValue: buildQuantumUrgencyDefault(data),
        },
      ],
    },
    {
      id: 'crypto-inventory',
      title: 'Crypto Inventory — Detail',
      description:
        'Algorithms, infrastructure layers, use cases. The basis of the migration scope.',
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
      id: 'algorithm-migrations',
      title: 'Classical → PQC Algorithm Map',
      description: 'Proposed substitutions per algorithm with urgency and vulnerability flags.',
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
      id: 'category-drivers',
      title: 'Score Drivers',
      description: 'Per-dimension scores + explanation of what drove each.',
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
      id: 'migration-effort',
      title: 'Migration Effort Breakdown',
      description: 'Per-algorithm complexity and scope — shapes the sprint plan.',
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
      title: 'Sprint Plan',
      description: 'Sprint-cadence rollout of CBOM, library upgrades, and hybrid PoCs.',
      fields: [
        {
          id: 'timeline',
          label: 'Sprint Plan',
          type: 'textarea',
          defaultValue: buildTimelineDefault(data, 'developer'),
        },
      ],
    },
    {
      id: 'actions',
      title: 'Action Items',
      description: 'Top prioritized engineering actions.',
      fields: [
        {
          id: 'recommendations',
          label: 'Action Items',
          type: 'textarea',
          defaultValue: buildRecommendedActionsDefault(data, 'developer'),
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

    let md = '# PQC Migration — Technical Proposal\n\n'
    md += `**Prepared:** ${dateStr}\n`
    if (d.industry) md += `**Industry:** ${d.industry}\n`
    if (d.country) md += `**Country:** ${d.country}\n`
    md += '**Audience:** Engineering leadership + platform / crypto owners\n\n---\n\n'

    md += '## 1. TL;DR\n\n'
    md += `${get('tldr', 'summary')}\n\n`

    md += '## 2. Risk Posture\n\n'
    md += `${get('risk-overview', 'risks')}\n\n`

    md += '## 3. HNDL / HNFL Urgency\n\n'
    md += `${get('quantum-urgency', 'urgency')}\n\n`

    md += '## 4. Crypto Inventory\n\n'
    md += `${get('crypto-inventory', 'inventory')}\n\n`

    md += '## 5. Algorithm Migration Map\n\n'
    md += `${get('algorithm-migrations', 'migrations')}\n\n`

    md += '## 6. Score Drivers\n\n'
    md += `${get('category-drivers', 'drivers')}\n\n`

    md += '## 7. Migration Effort\n\n'
    md += `${get('migration-effort', 'effort')}\n\n`

    md += '## 8. Sprint Plan\n\n'
    md += `${get('timeline', 'timeline')}\n\n`

    md += '## 9. Action Items\n\n'
    md += `${get('actions', 'recommendations')}\n\n---\n\n`

    md += '*Customized for the Developer role via PQC Today Command Center.*\n'
    return md
  }

  return {
    title: 'PQC Migration — Technical Proposal',
    description: 'An engineering-focused brief for sprint planning and architecture alignment.',
    objective: buildPitchObjective('developer'),
    filename: 'pqc-tech-proposal',
    sections,
    renderPreview,
  }
}
