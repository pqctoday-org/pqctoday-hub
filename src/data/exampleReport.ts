// SPDX-License-Identifier: GPL-3.0-only
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

export const EXAMPLE_REPORT_RESULT = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)

export const EXAMPLE_REPORT_SHARE_TOKEN = encodeShareToken({
  result: EXAMPLE_REPORT_RESULT,
  persona: EXAMPLE_REPORT_PERSONA,
})

/** Convenience URL for direct linking from the curious empty state. */
export const EXAMPLE_REPORT_URL = `/report?share=${EXAMPLE_REPORT_SHARE_TOKEN}`
