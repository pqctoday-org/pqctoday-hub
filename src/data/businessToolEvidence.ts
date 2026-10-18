// SPDX-License-Identifier: AGPL-3.0-only

export type BusinessEvidenceClass =
  | 'financial-scenario-model'
  | 'scenario-model'
  | 'planning-worksheet'
  | 'draft-template'
  | 'evidence-organizer'
  | 'technical-design-model'

export interface BusinessToolEvidence {
  evidenceClass: BusinessEvidenceClass
  label: string
  proves: string
  doesNotProve: string
}

const EVIDENCE_CLASS_COPY: Record<
  BusinessEvidenceClass,
  Omit<BusinessToolEvidence, 'evidenceClass'>
> = {
  'financial-scenario-model': {
    label: 'Financial scenario model',
    proves: 'Shows the arithmetic produced by the assumptions and inputs you selected.',
    doesNotProve:
      'It is not a forecast, actuarial opinion, investment recommendation, approved budget or promise of avoided loss.',
  },
  'scenario-model': {
    label: 'Scenario model',
    proves: 'Shows how the selected planning assumptions change the modelled outcome.',
    doesNotProve:
      "It does not predict when a cryptographically relevant quantum computer will exist or establish your organization's actual exposure.",
  },
  'planning-worksheet': {
    label: 'Planning worksheet',
    proves: 'Organizes the choices and information entered in this browser session.',
    doesNotProve:
      'It is not an approved plan, complete inventory, control assessment, risk acceptance or evidence that work was performed.',
  },
  'draft-template': {
    label: 'Draft template',
    proves: 'Turns the choices you enter into an editable first draft.',
    doesNotProve:
      'It is not legal advice, an approved policy or contract, a board decision, or evidence that any obligation has been met.',
  },
  'evidence-organizer': {
    label: 'Evidence organizer',
    proves:
      "Organizes supplied records and declared statuses against the tool's educational structure.",
    doesNotProve:
      'It does not independently inspect systems, verify supplied evidence, determine applicability, or establish audit, certification or compliance status.',
  },
  'technical-design-model': {
    label: 'Technical design worksheet',
    proves: 'Makes architecture, interoperability and migration assumptions visible for review.',
    doesNotProve:
      'It is not an implementation test, security assessment, production design approval or guarantee of interoperability.',
  },
}

const CLASS_BY_TOOL_ID: Record<string, BusinessEvidenceClass> = {
  'roi-calculator': 'financial-scenario-model',
  'board-pitch': 'draft-template',
  'breach-simulator': 'financial-scenario-model',
  'cost-of-inaction': 'financial-scenario-model',
  'cost-model-explorer': 'financial-scenario-model',
  'crqc-scenario': 'scenario-model',
  'risk-register': 'planning-worksheet',
  'risk-treatment-plan': 'planning-worksheet',
  'compliance-checklist': 'evidence-organizer',
  'audit-checklist': 'evidence-organizer',
  'compliance-timeline': 'planning-worksheet',
  'raci-builder': 'planning-worksheet',
  'policy-generator': 'draft-template',
  'kpi-dashboard': 'planning-worksheet',
  'vendor-scorecard': 'evidence-organizer',
  'contract-clause': 'draft-template',
  'supply-chain-matrix': 'evidence-organizer',
  'roadmap-builder': 'planning-worksheet',
  'stakeholder-comms': 'draft-template',
  'kpi-tracker': 'planning-worksheet',
  'deployment-playbook': 'draft-template',
  'hybrid-transition-planner': 'technical-design-model',
  'mti-negotiator': 'technical-design-model',
  'crypto-api-refactor-audit': 'evidence-organizer',
  'cloud-responsibility-matrix': 'technical-design-model',
  'crypto-architecture-diagram': 'technical-design-model',
  'management-tools-audit': 'evidence-organizer',
  'crypto-cbom-builder': 'evidence-organizer',
  'crypto-vulnerability-watch': 'evidence-organizer',
  'program-charter': 'draft-template',
  'initial-scoping': 'planning-worksheet',
  'skills-team-plan': 'planning-worksheet',
  'infra-modernization-planner': 'technical-design-model',
  'refresh-cycle-alignment': 'planning-worksheet',
  'accelerated-execution-profile': 'planning-worksheet',
  'data-at-rest-strategy': 'technical-design-model',
  'migration-verification': 'evidence-organizer',
}

export function businessToolEvidence(toolId: string): BusinessToolEvidence | undefined {
  // eslint-disable-next-line security/detect-object-injection -- registry-controlled id
  const evidenceClass = CLASS_BY_TOOL_ID[toolId]
  if (!evidenceClass) return undefined
  // eslint-disable-next-line security/detect-object-injection -- closed evidence-class union
  return { evidenceClass, ...EVIDENCE_CLASS_COPY[evidenceClass] }
}

export const BUSINESS_TOOL_EVIDENCE_IDS = Object.freeze(Object.keys(CLASS_BY_TOOL_ID))
