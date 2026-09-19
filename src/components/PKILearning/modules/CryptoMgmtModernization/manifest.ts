// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-mgmt-modernization',
  contentVersion: 7,
  lm_id: 'LM-052',
  title: 'Cryptographic Management Modernization',
  description:
    'Build a modern cryptographic posture management program across certificates, libraries, software, and keys — iterative and ROI-positive even if quantum never arrives.',
  whyThisMatters:
    "A cryptographic posture management program pays for itself even if quantum computers never arrive — certificate outages and forgotten keys are today's incidents; PQC readiness is just the reason budget finally exists to fix it.",
  duration: '55 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p1',
  track: 'Executive',
  trackOrder: 4,
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
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM', 'SLH-DSA'],
    standards: ['NIST SP 800-90B', 'RFC 8555', 'OMB M-23-02', 'NIST SP 800-131A', 'RFC 9370'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoMgmtModernizationModule })),
}

export default manifest
