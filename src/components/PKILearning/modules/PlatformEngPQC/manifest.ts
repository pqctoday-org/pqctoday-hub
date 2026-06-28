// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'platform-eng-pqc',
  lm_id: 'LM-031',
  title: 'Platform Engineering & PQC',
  description:
    'Inventory, migrate, and monitor every cryptographic primitive in your software delivery pipeline — CI/CD crypto assets, container image signing, IaC quantum-vulnerable defaults, OPA/Kyverno algorithm enforcement, and crypto posture monitoring.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: ['p1', 'p5'],
  track: 'Applications',
  trackOrder: 0,
  learnSections: [
    { id: 'quantum-threats-platform', label: 'Platform Crypto Threats' },
    { id: 'crypto-asset-discovery', label: 'CI/CD Crypto Discovery' },
    { id: 'container-signing', label: 'Container Signing ML-DSA' },
    { id: 'iac-crypto-config', label: 'IaC Quantum-Vulnerable' },
    { id: 'policy-enforcement', label: 'Algorithm Agility Policy' },
    { id: 'monitoring-posture', label: 'Crypto Posture Monitoring' },
    { id: 'migration-runway', label: 'Migration & Rollback' },
  ],
  workshopSteps: [
    { id: 'pipeline-crypto-inventory', label: 'Pipeline Crypto Inventory' },
    { id: 'quantum-threat-timeline', label: 'Quantum Threat Timeline' },
    { id: 'container-signing-migration', label: 'Container Signing Migration' },
    { id: 'policy-as-code-enforcer', label: 'Policy-as-Code Enforcer' },
    { id: 'crypto-posture-monitor', label: 'Crypto Posture Monitor' },
    { id: 'platform-migration-planner', label: 'Platform Migration Planner' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PlatformEngPQCModule })),
}

export default manifest
