// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'crypto-mgmt-modernization',
  whyThisMatters:
    'Certificate outages and unmanaged keys create present-day costs. Compare a management programme’s expected savings with its costs, including a case without quantum-related benefits; the return depends on scoped work and assumptions.',
  learnSections: [
    { id: 'why-now', label: 'Why Modernize Crypto Now' },
    { id: 'cpm-defined', label: 'CPM vs Crypto-Agility' },
    { id: 'asset-classes', label: 'Four Crypto Asset Classes' },
    { id: 'five-pillars', label: 'The Five Pillars of CPM' },
    { id: 'dual-loop', label: 'Dual-Loop Process' },
    { id: 'no-regret-roi', label: 'The No-Regret ROI' },
  ],
  workshopSteps: [
    { id: 'maturity-assessment', label: 'CPM Maturity Self-Assessment' },
    { id: 'inventory-lifecycle', label: 'Inventory Lifecycle Simulator' },
    { id: 'library-cbom-builder', label: 'Library & Hardware CBOM Builder' },
    { id: 'no-regret-roi', label: 'No-Regret ROI Builder' },
    { id: 'posture-kpi', label: 'Posture KPI Dashboard Designer' },
    { id: 'management-tools-audit', label: 'Management Tools Coverage Audit' },
    { id: 'risk-analysis-engine', label: 'Risk Analysis & Prioritisation Engine' },
    { id: 'mitigate-migrate', label: 'Implement — Mitigate or Migrate' },
    { id: 'clm-vendor-evaluator', label: 'CLM Vendor Evaluator' },
  ],
  startHere: {
    step: 'library-cbom-builder',
    text: 'Load a sample SBOM into the Library & Hardware CBOM Builder: it becomes a crypto-focused CBOM with library end-of-life and FIPS 140-3 status, and feeds the risk engine in step 7.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoMgmtModernizationModule })),
}

export default resolveManifest(manifest)
