// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Example report fixture for the curious-persona empty state on /report.
 *
 * ACCURACY-0708-2: this used to encode partial inputs and let `<ReportView>`
 * recompute a score from them at decode time. It now computes the result
 * once, at module load, with the same `computeAssessment` pipeline every
 * real assessment uses, and embeds that snapshot in a v2 share token — the
 * example report an example-report visitor sees is byte-identical every
 * time, and opening it is now a read-only ephemeral view (see ReportView)
 * that never writes into the visitor's own assessment/persona store.
 */
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import type { AssessmentInput } from '@/hooks/assessmentTypes'
import { encodeShareToken } from '@/utils/reportShareToken'

// A realistic but fictional sample — "a fintech CISO who has started
// thinking about PQC but hasn't migrated yet." Every value here should be a
// canonical value from the assess wizard's own vocabulary (AVAILABLE_*
// constants) so the computed report reads the way a real quick-track user's
// would. `exampleReport.test.ts` guards this.
export const EXAMPLE_REPORT_SHARE_PAYLOAD: AssessmentInput = {
  industry: 'Finance & Banking',
  country: 'United States',
  currentCrypto: ['RSA-2048', 'ECDSA P-256'],
  dataSensitivity: ['high', 'critical'],
  complianceRequirements: ['PCI DSS', 'FIPS 140-3'],
  migrationStatus: 'planning',
}

export const EXAMPLE_REPORT_PERSONA = 'curious'

// `computeAssessment` stamps `generatedAt` with the current time, which made
// the share token (and so the sample-report link on /report and /sponsor)
// change on every build and every page load. Pin it so the link is stable.
export const EXAMPLE_REPORT_GENERATED_AT = '2026-10-15T00:00:00.000Z'

export const EXAMPLE_REPORT_RESULT = {
  ...computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD),
  generatedAt: EXAMPLE_REPORT_GENERATED_AT,
}

export const EXAMPLE_REPORT_SHARE_TOKEN = encodeShareToken({
  result: EXAMPLE_REPORT_RESULT,
  persona: EXAMPLE_REPORT_PERSONA,
})

/**
 * The GRC worked example (GRC journey audit, 15 Oct 2026). GRC is pointed at the
 * comprehensive assessment, but `?example=1` showed every reader the quick-track
 * sample above, so the GRC report sections that need retention, credential
 * lifetime, use cases and infrastructure (HNDL/HNFL windows, domain scores) were
 * empty in the very example GRC was sent to. Same fictional bank, answered on the
 * comprehensive track; every value is a canonical assess-wizard key.
 */
export const EXAMPLE_REPORT_GRC_PAYLOAD: AssessmentInput = {
  ...EXAMPLE_REPORT_SHARE_PAYLOAD,
  cryptoUseCases: ['TLS/HTTPS', 'Data-at-rest encryption', 'Digital signatures / code signing'],
  dataRetention: ['7y', '10-25y'],
  credentialLifetime: ['3-10y'],
  systemCount: '51-200',
  teamSize: '11-50',
  cryptoAgility: 'partially-abstracted',
  infrastructure: ['Hardware', 'Security Stack', 'Cloud'],
  vendorDependency: 'mixed',
  timelinePressure: 'within-2-3y',
}

export const EXAMPLE_REPORT_GRC_RESULT = {
  ...computeAssessment(EXAMPLE_REPORT_GRC_PAYLOAD),
  generatedAt: EXAMPLE_REPORT_GENERATED_AT,
}

/** The worked example a reader of this persona should see. */
export function exampleReportResultFor(persona: string | null | undefined) {
  return persona === 'grc' ? EXAMPLE_REPORT_GRC_RESULT : EXAMPLE_REPORT_RESULT
}

/** Convenience URL for direct linking from the curious empty state. */
export const EXAMPLE_REPORT_URL = `/report?share=${EXAMPLE_REPORT_SHARE_TOKEN}`
