// SPDX-License-Identifier: AGPL-3.0-only
import { computeAssessment } from '@/hooks/useAssessmentEngine'
import type { AssessmentInput } from '@/hooks/assessmentTypes'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'

export const SAMPLE_ORG_KEY = '__sample_org__'

export const SAMPLE_ORG_INPUT = {
  industry: 'Finance & Banking',
  country: 'United States',
  currentCrypto: ['RSA-2048', 'ECDSA', 'AES-256', 'SHA-256'],
  dataSensitivity: ['critical', 'high'],
  complianceRequirements: ['PCI DSS', 'GDPR'],
  migrationStatus: 'not-started',
  cryptoUseCases: ['TLS/HTTPS', 'Data-at-rest encryption', 'Digital signatures'],
  dataRetention: ['10-25y', 'indefinite'],
  systemCount: '200-plus',
  teamSize: '11-50',
  cryptoAgility: 'partially-abstracted',
  infrastructure: ['Cloud Storage', 'HSM / Hardware security modules'],
  vendorDependency: 'mixed',
  timelinePressure: 'within-2-3y',
} satisfies AssessmentInput

/** Load an explicitly fictional result without editing the learner's questionnaire. */
export function loadSampleOrganisation(): void {
  const current = useAssessmentResultStore.getState()
  // A sample launch must neither replace a learner result nor restamp an existing sample.
  if (current.lastResult) return
  useAssessmentResultStore.setState({
    lastResult: computeAssessment(SAMPLE_ORG_INPUT),
    completedAt: new Date().toISOString(),
    sourceInputKey: SAMPLE_ORG_KEY,
  })
}
