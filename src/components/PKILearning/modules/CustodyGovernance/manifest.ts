// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'custody-governance',
  whyThisMatters:
    'Regulatory citations, clean assurance reports, and crime-insurance certificates are frequently misread as proof that a custody architecture cannot be drained. Better governance decisions require testing where policy is enforced under explicit authority assumptions, separating binding statutory rules from guidance and accounting context, and checking the exact scope and exclusions of audits and insurance.',
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
  load: () => import('./index').then((m) => ({ default: m.CustodyGovernanceModule })),
}

export default manifest
