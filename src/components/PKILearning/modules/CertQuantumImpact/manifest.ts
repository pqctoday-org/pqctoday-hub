// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'cert-quantum-impact',
  contentVersion: 1,
  lm_id: 'LM-079',
  title: 'Certification Engineer Quantum Impact',
  description:
    'How PQC reshapes cryptographic module validation: FIPS 140-2 Historical transition, CMVP/ACVP PQC testing, ESV entropy validation, EUCC/NIAP Policy #33, and PCI PTS HSM v5.0 scope boundaries.',
  whyThisMatters:
    'Post-quantum migration is a validation-engineering bottleneck before it is a deployment milestone: certification engineers must separate algorithm testing from module validation, plan around CMVP/ESV queue lead times, and verify scheme-specific evidence across FIPS 140-3, EUCC, NIAP, and PCI.',
  duration: '25 min',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Role Guides',
  trackOrder: 6,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Certification Evidence Scope' },
  ],
  startHere: {
    step: 'self-assessment',
    text: 'Answer Yes, No, or Unknown in the Certification Evidence Scope: nine questions identify applicable validation drivers and evidence gaps without turning unanswered items into a low-exposure score.',
  },
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
    standards: [
      'FIPS 203',
      'FIPS 204',
      'FIPS 205',
      'FIPS 140-3',
      'NIST IR 8547',
      'NSA CNSA 2.0',
      'OMB M-26-15',
      'NIST SP 800-90B',
    ],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CertQuantumImpactModule })),
}

export default manifest
