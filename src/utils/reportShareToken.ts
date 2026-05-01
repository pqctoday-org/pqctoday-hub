// SPDX-License-Identifier: GPL-3.0-only
/**
 * Encode/decode a minimal share schema for /report URL tokens.
 *
 * Encodes assessment inputs (no PII, no free-text) into a compact base64 URL
 * parameter. Recipients decode the token and seed ephemeral store state so
 * they can view the originator's report without retaking the assessment.
 *
 * Encoding: JSON → UTF-8 → base64url (URL-safe, no padding)
 * Max typical size: ~300–600 bytes for a full assessment.
 */

export interface ReportShareSchema {
  /** Schema version — bump if fields change. */
  v: number
  /** Industry label (e.g. "Finance") */
  industry?: string
  /** ISO country code or country name */
  country?: string
  /** Region: 'americas' | 'eu' | 'apac' | 'global' */
  region?: string
  /** Current crypto algorithm IDs */
  currentCrypto?: string[]
  /** Data sensitivity flags */
  dataSensitivity?: string[]
  /** Compliance framework IDs */
  complianceRequirements?: string[]
  /** Migration status value */
  migrationStatus?: string
  /** Active persona ID */
  persona?: string
  /** Risk score (0–100) */
  riskScore?: number
  /** Risk level label */
  riskLevel?: string
}

const SCHEMA_VERSION = 1

function toBase64url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64url(str: string): string {
  const padded =
    str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  return decodeURIComponent(escape(atob(padded)))
}

export function encodeShareToken(schema: Omit<ReportShareSchema, 'v'>): string {
  const full: ReportShareSchema = { v: SCHEMA_VERSION, ...schema }
  return toBase64url(JSON.stringify(full))
}

export function decodeShareToken(token: string): ReportShareSchema | null {
  try {
    const raw = fromBase64url(token)
    const parsed = JSON.parse(raw) as ReportShareSchema
    if (typeof parsed !== 'object' || parsed === null || parsed.v !== SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}
