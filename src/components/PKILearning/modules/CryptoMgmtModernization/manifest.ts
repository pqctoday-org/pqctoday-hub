// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-mgmt-modernization',
  contentVersion: 2,
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
  ],
  embeddable: true,
  practiceInSim: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoMgmtModernizationModule })),
}

export default manifest
