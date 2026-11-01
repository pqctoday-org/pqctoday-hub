// SPDX-License-Identifier: AGPL-3.0-only
import type { RiskEntry } from '@/store/useRiskRegisterStore'
import type { RoadmapMilestone } from '@/components/PKILearning/modules/MigrationProgram/components/roadmapTracks'
import { PROGRAM_START_YEAR } from '@/data/narrationFacts'

export const BANK_CASE_NOTE =
  'Fictional bank teaching example. Findings and scores are sample assumptions, not discoveries or technical test results. Delivery milestones are proposed future work, conditional on review gates. No private-bank regulatory obligation is inferred from federal or EU reference dates.'

export function bankRiskEntries(): RiskEntry[] {
  return [
    {
      id: 'bank-portal',
      assetName: 'Customer portal — connection confidentiality',
      currentAlgorithm: 'ECDH / X25519',
      threatVector: 'hndl',
      likelihood: 3,
      impact: 4,
      mitigation:
        'Sample assumption: portal is a pilot candidate. Scores are ordinal discussion inputs, not measured probabilities. Establish compatibility, performance, security and rollback criteria; a pilot decision is not proof of readiness.',
    },
    {
      id: 'bank-archive',
      assetName: 'Records archiving and retrieval service — long-lived records and recovery',
      currentAlgorithm: 'RSA-2048',
      threatVector: 'hndl',
      likelihood: 3,
      impact: 5,
      mitigation:
        'Sample assumption: legacy dependencies block this service. Scores are ordinal discussion inputs. Resolve key-protection and recovery dependencies. Assess confidentiality lifetime, retention obligations, access and restore testing before choosing migration or retirement.',
    },
    {
      id: 'bank-signing',
      assetName: 'Software signing service — release authenticity and trust',
      currentAlgorithm: 'ECDSA P-256',
      threatVector: 'forgery',
      likelihood: 3,
      impact: 5,
      mitigation:
        'Sample assumption: supplier dependencies block this service. Scores are ordinal discussion inputs. Obtain commitments for signing and verification support. Plan trust distribution, compatibility and rollback; a supplier claim is not validation.',
    },
  ]
}

export function bankRoadmapMilestones(): RoadmapMilestone[] {
  const start = PROGRAM_START_YEAR
  return [
    {
      id: 'bank-discovery',
      label: 'Sample proposal: bounded discovery and planning mandate',
      year: start,
      phaseId: 'p0',
      track: 'program',
    },
    {
      id: 'bank-inventory',
      label: 'Planned: three-service inventory, owners, coverage gaps and supplier blockers',
      year: start,
      phaseId: 'p2',
      track: 'program',
      dependsOn: ['bank-discovery'],
    },
    {
      id: 'bank-risk',
      label: 'Planned: prioritise exposures and compare scoped cost ranges',
      year: start,
      phaseId: 'p3',
      track: 'program',
      dependsOn: ['bank-inventory'],
    },
    {
      id: 'bank-approval',
      label: 'Proposed: programme approval with conditional funding releases',
      year: start,
      phaseId: 'p4',
      track: 'program',
      dependsOn: ['bank-risk'],
    },
    {
      id: 'bank-portal-pilot',
      label: 'Planned: customer portal pilot; review test and rollback evidence before scaling',
      year: start + 1,
      phaseId: 'p5',
      track: 'A',
      dependsOn: ['bank-approval'],
    },
    {
      id: 'bank-archive-legacy',
      label: 'Planned: resolve archiving and retrieval legacy dependencies; test recovery',
      year: start + 2,
      phaseId: 'p6',
      track: 'A',
      dependsOn: ['bank-approval'],
    },
    {
      id: 'bank-signing-supplier',
      label: 'Planned: software signing supplier and verifier readiness gate',
      year: start + 2,
      phaseId: 'p7',
      track: 'B',
      dependsOn: ['bank-approval'],
    },
    {
      id: 'bank-scale',
      label: 'Planned: staged delivery only after service-specific acceptance criteria',
      year: start + 3,
      phaseId: 'p5',
      track: 'program',
      dependsOn: ['bank-portal-pilot', 'bank-archive-legacy', 'bank-signing-supplier'],
    },
    {
      id: 'bank-closure',
      label: 'Planned: verification, retirement decisions and continuing crypto-agility ownership',
      year: start + 4,
      phaseId: 'verify-close',
      track: 'program',
      dependsOn: ['bank-scale'],
    },
  ]
}
