// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'sbom',
  contentVersion: 17,
  lm_id: 'LM-063',
  title: 'Software Bill of Materials (SBOM)',
  description:
    'Inventory software components within a stated scope, with versions, supplier or producer details, and dependency relationships — one input for vulnerability triage and broader crypto-asset discovery.',
  duration: '30 min',
  whyThisMatters:
    'An SBOM can help teams investigate dependencies for vulnerability, licensing, and migration work. Its coverage depends on how it is generated and maintained, and downstream disciplines combine it with other evidence.',
  difficulty: 'intermediate',
  frameworkPhase: 'p1',
  track: 'Strategy',
  trackOrder: 4,
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
  taxonomy: {
    standards: [
      'SPDX / ISO 5962',
      'CycloneDX / ECMA-424',
      'NTIA Minimum Elements',
      'CISA 2026 Minimum Elements v2.1',
      'OASIS CSAF 2.0 (VEX)',
    ],
  },
  load: () => import('./index').then((m) => ({ default: m.SbomModule })),
}

export default manifest
