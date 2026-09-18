// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'vendor-risk',
  contentVersion: 5,
  lm_id: 'LM-038',
  title: 'Vendor & Supply Chain Risk',
  description:
    'Score vendor PQC readiness from real product data, generate contract requirements, and map supply chain risk.',
  whyThisMatters:
    "A vendor's PQC roadmap claim is only as good as the product data behind it — scoring readiness from real data, not marketing pages, is what actually protects a supply chain.",
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p7',
  track: 'Executive',
  trackOrder: 5,
  learnSections: [
    { id: 'readiness', label: 'Vendor PQC Readiness' },
    { id: 'supply-chain', label: 'Supply Chain Crypto Deps' },
    { id: 'contracts', label: 'PQC Contract Requirements' },
    { id: 'risk-matrix', label: 'Layer-wise Risk Matrix' },
  ],
  workshopSteps: [
    { id: 'infrastructure-selector', label: 'Infrastructure Selector' },
    { id: 'vendor-scorecard', label: 'Vendor Scorecard' },
    { id: 'contract-clauses', label: 'Contract Clauses' },
    { id: 'supply-chain-matrix', label: 'Supply Chain Matrix' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    standards: [
      'NIST SP 800-161r1',
      'CycloneDX CBOM',
      'NIST CSWP 39',
      'NIST SP 800-208',
      'NSA CNSA 2.0',
    ],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.VendorRiskModule })),
}

export default manifest
