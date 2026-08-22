// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'sbom',
  contentVersion: 7,
  lm_id: 'LM-063',
  title: 'Software Bill of Materials (SBOM)',
  description:
    'Inventory every software component a product depends on — supplier, version, dependency graph — the discovery input that feeds a CBOM and closes the vulnerability-triage loop with VEX.',
  duration: '30 min',
  whyThisMatters:
    "You can't patch, license-clear, or migrate what you don't know you depend on; the SBOM is the software inventory every downstream discipline — CBOM, vulnerability management, license compliance — builds on.",
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
  embeddable: false,
  practiceInSim: true,
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
