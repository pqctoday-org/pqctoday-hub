// SPDX-License-Identifier: GPL-3.0-only
/**
 * Example report fixture for the curious-persona empty state on /report.
 *
 * The share-token hydration path on `<ReportView>` accepts any base64url-encoded
 * `ReportShareSchema`. This module encodes a realistic but fictional sample —
 * "a fintech CISO who has started thinking about PQC but hasn't migrated yet" —
 * so a first-time visitor can see what a real report looks like without
 * completing the wizard themselves.
 */
import { encodeShareToken } from '@/utils/reportShareToken'

// Every token here MUST be a canonical value the report's share-hydration
// validators accept (AVAILABLE_INDUSTRIES / AVAILABLE_ALGORITHMS /
// AVAILABLE_COMPLIANCE / the sensitivity enum / VALID_MIGRATIONS) — otherwise the
// field is silently dropped on hydration and the "example" recomputes to a near
// empty report. `exampleReport.test.ts` guards this.
//
// The report recomputes the risk score/level from the seeded inputs, so no
// precomputed score is stored (an out-of-band number would only drift).
export const EXAMPLE_REPORT_SHARE_PAYLOAD = {
  industry: 'Finance & Banking',
  country: 'United States',
  region: 'americas' as const,
  currentCrypto: ['RSA-2048', 'ECDSA P-256'],
  dataSensitivity: ['high', 'critical'],
  complianceRequirements: ['PCI DSS', 'FIPS 140-3'],
  migrationStatus: 'planning' as const,
  persona: 'curious' as const,
}

export const EXAMPLE_REPORT_SHARE_TOKEN = encodeShareToken(EXAMPLE_REPORT_SHARE_PAYLOAD)

/** Convenience URL for direct linking from the curious empty state. */
export const EXAMPLE_REPORT_URL = `/report?share=${EXAMPLE_REPORT_SHARE_TOKEN}`
