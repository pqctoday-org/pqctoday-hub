// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'energy-utilities-pqc',
  contentVersion: 2,
  lm_id: 'LM-042',
  title: 'Energy & Utilities PQC',
  description:
    'PQC migration for power grids and utilities: NERC CIP compliance, IEC 61850/62351 substation security, DNP3/Modbus protocol hardening, smart meter key management at scale, and environmental/safety risk scoring.',
  whyThisMatters:
    "A compromised substation isn't a data breach, it's a power outage — NERC CIP and IEC 61850/62351 exist because grid crypto failures have physical, not just informational, consequences.",
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 1,
  learnSections: [
    { id: 'why-energy', label: 'Why Energy & Utilities' },
    { id: 'nerc-cip', label: 'NERC CIP & IEC 62351' },
    { id: 'substation-protocols', label: 'Substation Protocols' },
    { id: 'smart-meters', label: 'Smart Meter Management' },
    { id: 'safety-environmental', label: 'Safety & Environmental' },
    { id: 'lifecycle-connectivity', label: 'Lifecycle & Connectivity' },
    { id: 'water-wastewater', label: 'Water & Wastewater' },
  ],
  workshopSteps: [
    { id: 'protocol-security-analyzer', label: 'Protocol Analyzer' },
    { id: 'substation-migration-planner', label: 'Substation Planner' },
    { id: 'smart-meter-key-manager', label: 'Meter Key Manager' },
    { id: 'safety-risk-scorer', label: 'Risk Scorer' },
    { id: 'grid-migration-roadmap', label: 'Grid Roadmap' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EnergyUtilitiesModule })),
}

export default manifest
