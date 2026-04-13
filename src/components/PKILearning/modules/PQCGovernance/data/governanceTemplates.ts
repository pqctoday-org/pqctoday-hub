// SPDX-License-Identifier: GPL-3.0-only

export interface EscalationTier {
  tier: number
  name: string
  owner: string
  triggerExamples: string[]
  resolutionTimelineDays: number
  escalatesTo: string | null
}

export interface PolicyExceptionCriteria {
  id: string
  label: string
  description: string
  weight: 'high' | 'medium' | 'low'
}

export interface CompensatingControl {
  id: string
  label: string
  description: string
  applicableTo: string[]
}

export const ESCALATION_TIERS: EscalationTier[] = [
  {
    tier: 1,
    name: 'Team Lead',
    owner: 'Crypto Engineering Lead',
    triggerExamples: [
      'Algorithm selection disagreement within team',
      'Test environment configuration blockers',
      'Library version compatibility issues',
      'Minor schedule slippage (< 2 weeks)',
    ],
    resolutionTimelineDays: 5,
    escalatesTo: 'PQC Program Manager',
  },
  {
    tier: 2,
    name: 'PQC Program Manager',
    owner: 'PQC Program Manager',
    triggerExamples: [
      'Vendor unable to deliver PQC support by deadline',
      'Cross-team dependency blocking migration',
      'Budget variance > 10% on migration component',
      'Policy exception request from business unit',
    ],
    resolutionTimelineDays: 10,
    escalatesTo: 'CISO',
  },
  {
    tier: 3,
    name: 'CISO',
    owner: 'Chief Information Security Officer',
    triggerExamples: [
      'Regulatory deadline at risk of being missed',
      'Critical production system migration blockers',
      'Third-party vendor non-compliance with PQC mandate',
      'Risk acceptance request for high-severity gap',
    ],
    resolutionTimelineDays: 15,
    escalatesTo: 'Executive Steering Committee',
  },
  {
    tier: 4,
    name: 'Executive Steering Committee',
    owner: 'CTO / CRO / CFO',
    triggerExamples: [
      'Program-wide compliance deadline missed',
      'Board-level risk exposure from PQC delay',
      'M&A target with critical PQC gap',
      'Regulatory enforcement action initiated',
    ],
    resolutionTimelineDays: 30,
    escalatesTo: null,
  },
]

export const EXCEPTION_CRITERIA: PolicyExceptionCriteria[] = [
  {
    id: 'technical-feasibility',
    label: 'Technical Feasibility',
    description:
      'Is PQC migration technically impossible within the constraint period? (e.g., embedded firmware with no update mechanism)',
    weight: 'high',
  },
  {
    id: 'vendor-dependency',
    label: 'Vendor Dependency',
    description:
      'Does the system rely on a third-party component without a PQC roadmap? Is the vendor engaged?',
    weight: 'high',
  },
  {
    id: 'business-criticality',
    label: 'Business Criticality',
    description:
      'What is the revenue/operational impact of taking this system offline for migration?',
    weight: 'medium',
  },
  {
    id: 'data-sensitivity',
    label: 'Data Sensitivity & HNDL Risk',
    description:
      'Does this system encrypt long-lived sensitive data that adversaries may be harvesting now?',
    weight: 'high',
  },
  {
    id: 'compliance-window',
    label: 'Regulatory Compliance Window',
    description:
      'Does a regulatory deadline apply to this system? What is the fine exposure from non-compliance?',
    weight: 'medium',
  },
  {
    id: 'compensating-controls',
    label: 'Compensating Controls Available',
    description:
      'Can network isolation, key rotation, or hybrid encryption reduce risk while migration is pending?',
    weight: 'low',
  },
]

export const COMPENSATING_CONTROLS: CompensatingControl[] = [
  {
    id: 'network-isolation',
    label: 'Network Isolation',
    description: 'Restrict system to internal network segments; block external crypto negotiation.',
    applicableTo: ['vendor-dependency', 'technical-feasibility'],
  },
  {
    id: 'key-rotation',
    label: 'Accelerated Key Rotation',
    description:
      'Reduce key lifetime to minimize HNDL exposure window. Rotate monthly instead of annually.',
    applicableTo: ['data-sensitivity', 'vendor-dependency'],
  },
  {
    id: 'hybrid-encryption',
    label: 'Hybrid Classical + PQC Wrapper',
    description:
      'Wrap existing classical encryption with a PQC KEM layer at the application boundary.',
    applicableTo: ['technical-feasibility', 'vendor-dependency'],
  },
  {
    id: 'data-minimization',
    label: 'Data Minimization',
    description:
      'Reduce the volume and lifetime of sensitive data processed by the non-compliant system.',
    applicableTo: ['data-sensitivity'],
  },
  {
    id: 'enhanced-monitoring',
    label: 'Enhanced Monitoring & Alerting',
    description:
      'Deploy crypto traffic monitoring to detect anomalies or downgrade attacks while migration is pending.',
    applicableTo: ['compliance-window', 'business-criticality'],
  },
  {
    id: 'vendor-escrow',
    label: 'Vendor SLA with PQC Commitment',
    description:
      'Negotiate a contractual PQC delivery commitment and escrow arrangement with the vendor.',
    applicableTo: ['vendor-dependency', 'compliance-window'],
  },
]
