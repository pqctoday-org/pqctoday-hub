// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'sbom',
  whyThisMatters:
    'An SBOM can help teams investigate dependencies for vulnerability, licensing, and migration work. Its coverage depends on how it is generated and maintained, and downstream disciplines combine it with other evidence.',
  learnSections: [
    { id: 'sbom-why', label: 'Why an SBOM' },
    { id: 'sbom-formats', label: 'SPDX vs CycloneDX' },
    { id: 'sbom-elements', label: 'Minimum Elements' },
    { id: 'sbom-2026-update', label: '2026 Update' },
    { id: 'sbom-vex', label: 'VEX & Vulnerability Triage' },
    { id: 'sbom-regulation', label: 'EO 14028 & EU CRA' },
    { id: 'sbom-to-cbom', label: 'Bridge: From SBOM to CBOM' },
  ],
  workshopSteps: [
    { id: 'sbom-format-explorer', label: 'SBOM Format Explorer' },
    { id: 'sbom-generation-picker', label: 'Generation Tool Picker' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'sbom-format-explorer',
    text: "Pick a sample component in the SBOM Format Explorer: the same package is shown as a CycloneDX entry and an SPDX package side by side, with the nine minimum elements mapped to each format's fields.",
  },
  // Sim-embeddable since 2026-09-28 (user decision D1): a P2 tree step.
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SbomModule })),
}

export default resolveManifest(manifest)
