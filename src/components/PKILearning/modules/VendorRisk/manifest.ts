// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'vendor-risk',
  whyThisMatters:
    "A vendor's PQC roadmap claim is only as good as the product data behind it — scoring readiness from real data, not marketing pages, is what actually protects a supply chain.",
  learnSections: [
    { id: 'readiness', label: 'Vendor PQC Readiness' },
    { id: 'supply-chain', label: 'Vendor PQC Scorecards' },
    { id: 'cbom', label: 'CBOM: Crypto Bill of Materials' },
    { id: 'contracts', label: 'PQC Contract Requirements' },
    { id: 'risk-matrix', label: 'Vendor Assessment Framework' },
  ],
  workshopSteps: [
    { id: 'infrastructure-selector', label: 'Infrastructure Selector' },
    { id: 'vendor-scorecard', label: 'Vendor Scorecard' },
    { id: 'contract-clauses', label: 'Contract Clauses' },
    { id: 'supply-chain-matrix', label: 'Supply Chain Matrix' },
  ],
  startHere: {
    step: 'vendor-scorecard',
    text: 'Select your products in step 1, then score two vendors on the same PQC readiness dimensions in the Vendor Scorecard and compare the totals.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.VendorRiskModule })),
}

export default resolveManifest(manifest)
