// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'energy-utilities-pqc',
  lm_id: 'LM-042',
  title: 'Energy & Utilities PQC',
  description:
    'PQC migration for power grids and utilities: NERC CIP compliance, IEC 61850/62351 substation security, DNP3/Modbus protocol hardening, smart meter key management at scale, and environmental/safety risk scoring.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 1,
  learnSections: [
    { id: 'why-energy', label: 'Why Energy & Utilities Is Different' },
    { id: 'nerc-cip', label: 'NERC CIP & IEC 62351 Compliance' },
    { id: 'substation-protocols', label: 'Substation Protocols (IEC 61850, DNP3, Modbus)' },
    { id: 'smart-meters', label: 'Smart Meter Key Management at Scale' },
    { id: 'safety-environmental', label: 'Safety & Environmental Risk' },
    { id: 'lifecycle-connectivity', label: 'Extended Lifecycles & Connectivity Challenges' },
  ],
  workshopSteps: [
    { id: 'protocol-security-analyzer', label: 'Protocol Analyzer' },
    { id: 'substation-migration-planner', label: 'Substation Planner' },
    { id: 'smart-meter-key-manager', label: 'Meter Key Manager' },
    { id: 'safety-risk-scorer', label: 'Risk Scorer' },
    { id: 'grid-migration-roadmap', label: 'Grid Roadmap' },
  ],
  load: () => import('./index').then((m) => ({ default: m.EnergyUtilitiesModule })),
}

export default manifest
