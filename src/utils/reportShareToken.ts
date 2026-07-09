// SPDX-License-Identifier: GPL-3.0-only
/**
 * Encode/decode the share schema for /report URL tokens.
 *
 * ACCURACY-0708-2: v1 embedded partial (quick-track-only) inputs plus a
 * `riskScore`/`riskLevel` that decode then IGNORED, recomputing a different
 * score from the partial inputs and forcing `mode: 'comprehensive'`
 * regardless of what the sender actually ran. v2 instead embeds the sender's
 * exact computed `AssessmentResult` as a snapshot — decode renders it
 * directly, with no recompute, so a scoring-logic change shipped after a
 * link was created can never silently alter what a recipient sees. v1
 * tokens (already circulating, e.g. from /sponsor) still decode — callers
 * should treat them as an approximate, best-effort view (see ReportView).
 *
 * Encoding: JSON → UTF-8 → base64url (URL-safe, no padding)
 */
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import type { PersonaId } from '@/data/learningPersonas'

/** Legacy (pre-ACCURACY-0708-2) token: partial quick-track inputs + a score
 *  that was never actually honored on decode. Kept only for backward
 *  compatibility with links generated before this fix shipped. */
export interface ReportShareSchemaV1 {
  v: 1
  industry?: string
  country?: string
  region?: string
  currentCrypto?: string[]
  dataSensitivity?: string[]
  complianceRequirements?: string[]
  migrationStatus?: string
  persona?: string
  riskScore?: number
  riskLevel?: string
}

/** Current token: a full snapshot of the sender's computed report. */
export interface ReportShareSchemaV2 {
  v: 2
  /** The sender's exact computed result — decode renders this, never recomputes it. */
  result: AssessmentResult
  /** Sender's persona at share time, for section-gating parity in the
   *  recipient's ephemeral view only — never written to the recipient's own
   *  persona store. */
  persona?: PersonaId
}

export type ReportShareSchema = ReportShareSchemaV1 | ReportShareSchemaV2

const CURRENT_SCHEMA_VERSION = 2

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

export function encodeShareToken(payload: {
  result: AssessmentResult
  persona?: PersonaId | null
}): string {
  const full: ReportShareSchemaV2 = {
    v: CURRENT_SCHEMA_VERSION,
    result: payload.result,
    ...(payload.persona ? { persona: payload.persona } : {}),
  }
  return toBase64url(JSON.stringify(full))
}

export function decodeShareToken(token: string): ReportShareSchema | null {
  try {
    const raw = fromBase64url(token)
    const parsed = JSON.parse(raw) as { v?: unknown }
    if (typeof parsed !== 'object' || parsed === null) return null
    if (parsed.v === 1) return parsed as ReportShareSchemaV1
    if (parsed.v === 2) {
      const v2 = parsed as ReportShareSchemaV2
      if (!v2.result || typeof v2.result !== 'object') return null
      return v2
    }
    return null
  } catch {
    return null
  }
}
