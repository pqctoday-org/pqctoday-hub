// SPDX-License-Identifier: GPL-3.0-only
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { FormData, PitchVariant } from './types'
import {
  buildAlgorithmMigrationsDefault,
  buildCryptoInventoryDefault,
  buildExecutiveSummaryDefault,
  buildGovernanceDefault,
  buildMigrationEffortDefault,
  buildPitchObjective,
  buildQuantumUrgencyDefault,
  buildRecommendedActionsDefault,
  buildRiskOverviewDefault,
  buildTimelineDefault,
} from './sectionDefaults'

export function buildOpsVariant(data: ExecutiveModuleData): PitchVariant {
  const sections: ArtifactSection[] = [
    {
      id: 'tldr',
      title: 'Ops Summary',
      description: 'One-paragraph framing of the operational rollout ahead.',
      fields: [
        {
          id: 'summary',
          label: 'Ops Summary',
          type: 'textarea',
          defaultValue: buildExecutiveSummaryDefault(data, 'ops'),
        },
      ],
    },
    {
      id: 'risk-overview',
      title: 'Risk Posture',
      description: 'Composite risk context for ops planning.',
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
      title: 'HNDL / HNFL — Window to Act',
      description: 'Time-bound risks and what they mean for rollout pacing.',
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
      title: 'Crypto Inventory — Production Detail',
      description: 'What needs to be rotated, redeployed, and re-issued.',
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
      title: 'Algorithm Changes Impacting Ops',
      description: 'Classical → PQC swaps that change deployment, cert issuance, and rotation.',
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
      title: 'Effort Breakdown',
      description: 'Used to size rollout phases and canary groups.',
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
      title: 'Phased Rollout Plan',
      description: 'Canary → progressive rollout → cutover with rollback gates.',
      fields: [
        {
          id: 'timeline',
          label: 'Rollout Plan',
          type: 'textarea',
          defaultValue: buildTimelineDefault(data, 'ops'),
        },
      ],
    },
    {
      id: 'governance',
      title: 'On-call + Runbook Ownership',
      description: 'Who carries the pager, what the runbooks cover, how we escalate.',
      fields: [
        {
          id: 'governance',
          label: 'Ownership',
          type: 'textarea',
          defaultValue: buildGovernanceDefault(data, 'ops'),
        },
      ],
    },
    {
      id: 'actions',
      title: 'Operational Actions',
      description: 'Prioritized ops next steps.',
      fields: [
        {
          id: 'recommendations',
          label: 'Action Items',
          type: 'textarea',
          defaultValue: buildRecommendedActionsDefault(data, 'ops'),
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

    let md = '# PQC Migration — Operational Rollout Plan\n\n'
    md += `**Prepared:** ${dateStr}\n`
    if (d.industry) md += `**Industry:** ${d.industry}\n`
    if (d.country) md += `**Country:** ${d.country}\n`
    md += '**Audience:** Platform SRE + on-call + crypto ops leads\n\n---\n\n'

    md += '## 1. Ops Summary\n\n'
    md += `${get('tldr', 'summary')}\n\n`

    md += '## 2. Risk Posture\n\n'
    md += `${get('risk-overview', 'risks')}\n\n`

    md += '## 3. HNDL / HNFL Window\n\n'
    md += `${get('quantum-urgency', 'urgency')}\n\n`

    md += '## 4. Crypto Inventory\n\n'
    md += `${get('crypto-inventory', 'inventory')}\n\n`

    md += '## 5. Algorithm Changes\n\n'
    md += `${get('algorithm-migrations', 'migrations')}\n\n`

    md += '## 6. Effort Breakdown\n\n'
    md += `${get('migration-effort', 'effort')}\n\n`

    md += '## 7. Rollout Plan\n\n'
    md += `${get('timeline', 'timeline')}\n\n`

    md += '## 8. On-call + Runbook Ownership\n\n'
    md += `${get('governance', 'governance')}\n\n`

    md += '## 9. Operational Actions\n\n'
    md += `${get('actions', 'recommendations')}\n\n---\n\n`

    md += '*Customized for the Operations role via PQC Today Command Center.*\n'
    return md
  }

  return {
    title: 'PQC Migration — Operational Rollout Plan',
    description: 'A runbook-oriented brief for operational rollout planning.',
    objective: buildPitchObjective('ops'),
    filename: 'pqc-ops-plan',
    sections,
    renderPreview,
  }
}
