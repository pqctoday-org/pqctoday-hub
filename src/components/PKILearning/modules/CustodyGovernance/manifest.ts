// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'custody-governance',
  contentVersion: 2,
  lm_id: 'LM-086',
  title: 'Custody Governance & Assurance',
  description:
    'How a digital-asset custody design is evaluated, regulated, insured, and audited: six evaluation questions with Rule G1 authority checks, jurisdiction-scoped regulatory control maps with applicability gates, and what custody insurance, SOC 1/ISAE 3402, SOC 2, ISAE 3000 (Revised), and proof-of-reserves reports do and do not prove.',
  whyThisMatters:
    'Regulatory citations, clean assurance reports, and crime-insurance certificates are frequently misread as proof that a custody architecture cannot be drained. Better governance decisions require testing where policy is enforced under explicit authority assumptions, separating binding statutory rules from guidance and accounting context, and checking the exact scope and exclusions of audits and insurance.',
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 14,
  learnSections: [
    { id: 'evaluation-questions', label: '6. Six Custody Evaluation Questions' },
    { id: 'regulatory-requirements', label: '6b. Regulatory Control Map & Gates' },
    { id: 'insurance-and-audit', label: '6c. Insurance, Audit & Proof of Reserves' },
    { id: 'takeaways', label: '9C. Governance & Assurance Takeaways' },
  ],
  workshopSteps: [
    {
      id: 'regulation-control-mapper',
      label: 'Regulation & Assurance Control Mapper (W11)',
    },
  ],
  startHere: {
    step: 'regulation-control-mapper',
    text: 'Choose a built-in custody architecture preset and two jurisdictions side by side, apply the applicability gates, and compare quoted regulatory obligations against market-practice insurer and auditor expectations.',
  },
  taxonomy: {
    algorithms: ['ECDSA', 'ML-DSA'],
    standards: ['MiCA', 'DORA', 'SOC 2', 'ISAE 3402', 'ISAE 3000'],
  },
  load: () => import('./index').then((m) => ({ default: m.CustodyGovernanceModule })),
}

export default manifest
