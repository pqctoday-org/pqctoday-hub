// SPDX-License-Identifier: GPL-3.0-only
/**
 * simPlaybook — the per-phase "run the play": an ordered sequence of concrete
 * steps the player works through to clear a phase. Each step is one of:
 *  - learn:     complete a real Learn module
 *  - reference: look up real reference information
 *  - activity:  run a real Command-Center tool that GENERATES an artifact
 *
 * Completion is read from real hub state (module progress + generated artifacts
 * + a visited-reference set), not self-attested. Each step deep-links the tool.
 */
import type { PhaseId } from './frameworkPhases'
import type { ExecutiveDocumentType } from '@/services/storage/types'

export type StepKind = 'learn' | 'reference' | 'activity'

export interface PlaybookStep {
  kind: StepKind
  label: string
  /** Deep link into the real hub resource. */
  to: string
  /** learn: module id → completion via module progress. */
  moduleId?: string
  /** activity: the artifact type this tool emits → completion via the artifact store. */
  artifactType?: ExecutiveDocumentType
  /** reference: stable id → completion via the visited-refs set. */
  refId?: string
}

export const SIM_PLAYBOOK: Partial<Record<PhaseId, PlaybookStep[]>> = {
  p0: [
    {
      kind: 'learn',
      label: 'Learn: PQC Business Case',
      to: '/learn/pqc-business-case',
      moduleId: 'pqc-business-case',
    },
    { kind: 'reference', label: 'Check the CRQC threat horizon', to: '/threats', refId: 'threats' },
    {
      kind: 'activity',
      label: 'Produce a Program Charter',
      to: '/business/tools/program-charter',
      artifactType: 'program-charter',
    },
  ],
  p1: [
    {
      kind: 'learn',
      label: 'Learn: Cryptographic Management Modernization',
      to: '/learn/crypto-mgmt-modernization',
      moduleId: 'crypto-mgmt-modernization',
    },
    {
      kind: 'reference',
      label: 'Browse the Migrate discovery catalog',
      to: '/migrate',
      refId: 'migrate',
    },
    {
      kind: 'activity',
      label: 'Run the Management-Tools Audit',
      to: '/business/tools/management-tools-audit',
      artifactType: 'management-tools-audit',
    },
  ],
  p2: [
    {
      kind: 'learn',
      label: 'Learn: CBOM in Cryptographic Management',
      to: '/learn/crypto-mgmt-modernization',
      moduleId: 'crypto-mgmt-modernization',
    },
    {
      kind: 'reference',
      label: 'Reference: CycloneDX in the Library',
      to: '/library',
      refId: 'library',
    },
    {
      kind: 'activity',
      label: 'Build a CycloneDX CBOM',
      to: '/business/tools/crypto-cbom-builder',
      artifactType: 'crypto-cbom',
    },
  ],
  p3: [
    {
      kind: 'learn',
      label: 'Learn: PQC Risk Management',
      to: '/learn/pqc-risk-management',
      moduleId: 'pqc-risk-management',
    },
    {
      kind: 'reference',
      label: 'Reference: PQC Protocol Matrix',
      to: '/algorithms?tab=support',
      refId: 'algorithms-protocol-matrix',
    },
    {
      kind: 'activity',
      label: 'Produce a Risk Register',
      to: '/business/tools/risk-register',
      artifactType: 'risk-register',
    },
  ],
  p4: [
    {
      kind: 'learn',
      label: 'Learn: Migration Program Management',
      to: '/learn/migration-program',
      moduleId: 'migration-program',
    },
    {
      kind: 'reference',
      label: 'Reference: the 2026–2030 deadline squeeze',
      to: '/timeline',
      refId: 'timeline',
    },
    {
      kind: 'activity',
      label: 'Build a multi-year Roadmap',
      to: '/business/tools/roadmap-builder',
      artifactType: 'migration-roadmap',
    },
  ],
  p5: [
    {
      kind: 'learn',
      label: 'Learn: Hybrid Cryptography',
      to: '/learn/hybrid-crypto',
      moduleId: 'hybrid-crypto',
    },
    {
      kind: 'reference',
      label: 'Reference: which protocols have a PQC path',
      to: '/algorithms?tab=support',
      refId: 'algorithms-protocol-matrix',
    },
    {
      kind: 'activity',
      label: 'Draft a Deployment Playbook',
      to: '/business/tools/deployment-playbook',
      artifactType: 'deployment-playbook',
    },
  ],
  p6: [
    {
      kind: 'learn',
      label: 'Learn: HSM & PQC Operations',
      to: '/learn/hsm-pqc',
      moduleId: 'hsm-pqc',
    },
    {
      kind: 'learn',
      label: 'Learn: Network Security & PQC',
      to: '/learn/network-security-pqc',
      moduleId: 'network-security-pqc',
    },
    {
      kind: 'reference',
      label: 'Reference: algorithm sizes & FIPS/CC certs',
      to: '/compliance?cert=',
      refId: 'compliance-cert-check',
    },
  ],
  p7: [
    {
      kind: 'learn',
      label: 'Learn: Vendor & Supply-Chain Risk',
      to: '/learn/vendor-risk',
      moduleId: 'vendor-risk',
    },
    {
      kind: 'reference',
      label: 'Reference: vendor FIPS/CC cert status',
      to: '/compliance?cert=',
      refId: 'compliance-cert-check',
    },
    {
      kind: 'activity',
      label: 'Score vendors (Vendor Scorecard)',
      to: '/business/tools/vendor-scorecard',
      artifactType: 'vendor-scorecard',
    },
  ],
}
