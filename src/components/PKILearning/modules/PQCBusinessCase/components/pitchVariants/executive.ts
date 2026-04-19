// SPDX-License-Identifier: GPL-3.0-only
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { FormData, PitchVariant } from './types'
import {
  buildBudgetDefault,
  buildCostBenefitDefault,
  buildCryptoInventoryDefault,
  buildExecutiveSummaryDefault,
  buildGovernanceDefault,
  buildPeerBenchmarkDefault,
  buildPitchObjective,
  buildQuantumUrgencyDefault,
  buildRecommendedActionsDefault,
  buildRiskOverviewDefault,
  buildTimelineDefault,
} from './sectionDefaults'

export function buildExecutiveVariant(data: ExecutiveModuleData): PitchVariant {
  const budget = buildBudgetDefault(data)

  const sections: ArtifactSection[] = [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      description: 'One-paragraph board-level framing of why PQC migration is needed now.',
      fields: [
        {
          id: 'summary',
          label: 'Executive Summary',
          type: 'textarea',
          defaultValue: buildExecutiveSummaryDefault(data, 'executive'),
        },
      ],
    },
    {
      id: 'risk-overview',
      title: 'Risk Overview',
      description:
        'Quantified risk posture including any situational boosts that raised the score.',
      fields: [
        {
          id: 'risks',
          label: 'Risk Assessment Summary',
          type: 'textarea',
          defaultValue: buildRiskOverviewDefault(data),
        },
      ],
    },
    {
      id: 'quantum-urgency',
      title: 'Quantum Urgency — HNDL / HNFL',
      description:
        'Time-bound risks: long-retention data (HNDL) and long-lived signing credentials (HNFL).',
      fields: [
        {
          id: 'urgency',
          label: 'Harvest-Now Risks',
          type: 'textarea',
          defaultValue: buildQuantumUrgencyDefault(data),
        },
      ],
    },
    {
      id: 'crypto-inventory',
      title: 'Crypto Inventory — Summary',
      description: 'High-level view of what classical crypto is in scope.',
      fields: [
        {
          id: 'inventory',
          label: 'Crypto Inventory',
          type: 'textarea',
          defaultValue: buildCryptoInventoryDefault(data, 'summary'),
        },
      ],
    },
    {
      id: 'timeline',
      title: 'Proposed Timeline',
      description: 'Phased migration aligned to regulatory deadline.',
      fields: [
        {
          id: 'timeline',
          label: 'Migration Timeline',
          type: 'textarea',
          defaultValue: buildTimelineDefault(data, 'executive'),
        },
      ],
    },
    {
      id: 'cost-benefit',
      title: 'Cost-Benefit Analysis',
      description: 'Migration cost vs. cost of inaction. Refine with the ROI Calculator (Step 1).',
      fields: [
        {
          id: 'analysis',
          label: 'Cost-Benefit Analysis',
          type: 'textarea',
          defaultValue: buildCostBenefitDefault(data),
        },
      ],
    },
    {
      id: 'budget',
      title: 'Requested Budget',
      description: 'Total investment requested. Ranges are illustrative — scope with Finance.',
      fields: [
        {
          id: 'amount',
          label: 'Budget Request',
          type: 'text',
          defaultValue: budget.amount,
        },
        {
          id: 'breakdown',
          label: 'Budget Breakdown',
          type: 'textarea',
          defaultValue: budget.breakdown,
        },
      ],
    },
    {
      id: 'governance',
      title: 'Governance & Ownership',
      description: 'Sponsor, RACI, and reporting cadence.',
      fields: [
        {
          id: 'governance',
          label: 'Governance Structure',
          type: 'textarea',
          defaultValue: buildGovernanceDefault(data, 'executive'),
        },
      ],
    },
    {
      id: 'peer-benchmark',
      title: 'Peer Benchmark',
      description: 'Where peers stand under the same regulatory frameworks.',
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
      description: 'Top prioritized next steps — tailored for executive framing.',
      fields: [
        {
          id: 'recommendations',
          label: 'Recommended Actions',
          type: 'textarea',
          defaultValue: buildRecommendedActionsDefault(data, 'executive'),
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

    let md = '# PQC Migration Investment Proposal\n\n'
    md += `**Prepared:** ${dateStr}\n`
    if (d.industry) md += `**Industry:** ${d.industry}\n`
    if (d.country) md += `**Country:** ${d.country}\n`
    md += '**Audience:** Board / Executive Committee\n'
    md += '**Classification:** Confidential — Board Use Only\n\n---\n\n'

    md += '## 1. Executive Summary\n\n'
    md += `${get('executive-summary', 'summary')}\n\n`

    md += '## 2. Risk Overview\n\n'
    md += `${get('risk-overview', 'risks')}\n\n`

    md += '## 3. Quantum Urgency — HNDL / HNFL\n\n'
    md += `${get('quantum-urgency', 'urgency')}\n\n`

    md += '## 4. Crypto Inventory\n\n'
    md += `${get('crypto-inventory', 'inventory')}\n\n`

    md += '## 5. Proposed Timeline\n\n'
    md += `${get('timeline', 'timeline')}\n\n`

    md += '## 6. Cost-Benefit Analysis\n\n'
    md += `${get('cost-benefit', 'analysis')}\n\n`

    md += '## 7. Budget Request\n\n'
    md += `**Total:** ${get('budget', 'amount')}\n\n`
    const breakdown = formData['budget']?.breakdown as string
    if (breakdown) md += `${breakdown}\n\n`

    md += '## 8. Governance & Ownership\n\n'
    md += `${get('governance', 'governance')}\n\n`

    md += '## 9. Peer Benchmark\n\n'
    md += `${get('peer-benchmark', 'benchmark')}\n\n`

    md += '## 10. Recommended Actions\n\n'
    md += `${get('actions', 'recommendations')}\n\n---\n\n`

    md += '*Customized for the Executive / Board role via PQC Today Command Center.*\n'
    return md
  }

  return {
    title: 'PQC Migration Investment Proposal',
    description: 'Board-ready executive brief for PQC investment approval.',
    objective: buildPitchObjective('executive'),
    filename: 'pqc-board-pitch',
    sections,
    renderPreview,
  }
}
