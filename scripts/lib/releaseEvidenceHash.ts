// SPDX-License-Identifier: GPL-3.0-only
/**
 * Release evidence report: its location and the hashes a release freeze binds.
 *
 * The report (`public/data/validation/release-evidence.{json,md}`) is generated
 * and checked outside this repository before merge; release tooling here only
 * reads the committed report, so it needs these pure helpers and nothing else.
 */
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const REPORT_JSON_REL = 'public/data/validation/release-evidence.json'
export const REPORT_MD_REL = 'public/data/validation/release-evidence.md'

export const sha256 = (b: string | Buffer): string => createHash('sha256').update(b).digest('hex')

/** Canonical JSON: keys sorted, `undefined` members dropped. */
export function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
    .join(',')}}`
}

/** The figure sections of a report — what a claims review signs and a freeze binds. */
export const CLAIM_SECTIONS = [
  'vectors',
  'coverage',
  'waivers',
  'nativeSuites',
  'recordedRuns',
  'crossTarget',
  'openGaps',
  'workbench',
] as const

/**
 * SHA-256 over the canonical JSON of the figure sections only. Review status
 * and the checklist are excluded on purpose: recording a review, or a freeze,
 * must not change the claims that were reviewed or frozen.
 */
export const claimsSha256 = (r: Partial<Record<(typeof CLAIM_SECTIONS)[number], unknown>>) =>
  sha256(canonical(Object.fromEntries(CLAIM_SECTIONS.map((k) => [k, r[k]]))))

/** Result of the release-evidence check (report freshness and bound figures). */
export interface EvidenceCheckResult {
  errors: string[]
  notes: string[]
}

/**
 * The release-evidence check: `extraPaths` are presentation files whose
 * figures must match the report. Supplied by the caller (see release-freeze).
 */
export type EvidenceChecker = (root: string, extraPaths: string[]) => Promise<EvidenceCheckResult>
