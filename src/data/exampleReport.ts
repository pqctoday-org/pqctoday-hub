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

export const EXAMPLE_REPORT_SHARE_PAYLOAD = {
  industry: 'Finance',
  country: 'United States',
  region: 'americas' as const,
  currentCrypto: ['rsa-2048', 'ecdsa-p256'],
  dataSensitivity: ['pii', 'financial', 'high-value-archives'],
  complianceRequirements: ['fips-140-3', 'pci-dss', 'sox'],
  migrationStatus: 'planning',
  persona: 'curious' as const,
  riskScore: 62,
  riskLevel: 'medium' as const,
}

export const EXAMPLE_REPORT_SHARE_TOKEN = encodeShareToken(EXAMPLE_REPORT_SHARE_PAYLOAD)

/** Convenience URL for direct linking from the curious empty state. */
export const EXAMPLE_REPORT_URL = `/report?share=${EXAMPLE_REPORT_SHARE_TOKEN}`
