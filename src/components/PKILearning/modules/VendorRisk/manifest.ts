// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'vendor-risk',
  contentVersion: 4,
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.VendorRiskModule })),
}

export default manifest
