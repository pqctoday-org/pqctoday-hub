// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'platform-eng-pqc',
  whyThisMatters:
    'CI/CD pipelines and container images are full of cryptographic defaults nobody chose deliberately — IaC and policy-engine enforcement (OPA/Kyverno) are how you find and fix them before they ship, not after.',
  learnSections: [
    { id: 'quantum-threats-platform', label: 'Platform Crypto Threats' },
    { id: 'crypto-asset-discovery', label: 'CI/CD Crypto Discovery' },
    { id: 'container-signing', label: 'Container Signing ML-DSA' },
    { id: 'iac-crypto-config', label: 'IaC Quantum-Vulnerable' },
    { id: 'policy-enforcement', label: 'Algorithm Agility Policy' },
    { id: 'monitoring-posture', label: 'Crypto Posture Monitoring' },
    { id: 'migration-runway', label: 'Migration & Rollback' },
    { id: 'secure-software-delivery', label: 'Secure Software Delivery' },
  ],
  workshopSteps: [
    { id: 'pipeline-crypto-inventory', label: 'Pipeline Crypto Inventory' },
    { id: 'quantum-threat-timeline', label: 'Quantum Threat Timeline' },
    { id: 'container-signing-migration', label: 'Container Signing Migration' },
    { id: 'policy-as-code-enforcer', label: 'Policy-as-Code Enforcer' },
    { id: 'crypto-posture-monitor', label: 'Crypto Posture Monitor' },
    { id: 'platform-migration-planner', label: 'Platform Migration Planner' },
  ],
  startHere: {
    step: 'container-signing-migration',
    text: 'Compare OCI signing tools and their current PQC support. Review the proposed Sigstore deployment separately from the future ECDSA-to-ML-DSA migration path for cosign and Notation.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PlatformEngPQCModule })),
}

export default resolveManifest(manifest)
