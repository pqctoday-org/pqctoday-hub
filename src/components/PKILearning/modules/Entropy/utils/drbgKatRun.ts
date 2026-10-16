// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The DRBG step's known-answer check: every pinned NIST HMAC_DRBG vector, then
 * one-bit variants of two of them that must NOT match. Shared by the
 * DRBG component and its run-record tests so both exercise the same run.
 */
import {
  runHmacDrbgKatSuite,
  sabotageVariants,
  type HmacDrbgKatCase,
  type HmacDrbgKatOutcome,
} from './hmacDrbg'

/** The `_provenance.sources` entries of the pinned vector file, as shipped. */
export interface KatVectorSource {
  id: string
  producer: string
  repository?: string
  commit?: string
  url?: string
  zipSha256?: string
  files: Array<{ upstreamPath?: string; path?: string; sourceUrl?: string; sha256: string }>
}

export interface KatVectorFile {
  _provenance: { sources: KatVectorSource[]; retrieved: string }
  cases: HmacDrbgKatCase[]
}

export interface KatRun {
  outcomes: HmacDrbgKatOutcome[]
  /** One entry per one-bit variant; every one must NOT match. */
  sabotage: { caseId: string; input: string; matched: boolean }[]
  /** Upstream sources the pinned vectors were copied from. */
  sources: KatVectorSource[]
  startedAt: string
  finishedAt: string
}

/** Load the pinned NIST vectors on demand (kept out of the step's main chunk). */
export async function loadKatVectorFile(): Promise<KatVectorFile> {
  const mod = await import('./hmacDrbgSha256.kat.json')
  return mod.default as unknown as KatVectorFile
}

/** Vectors whose inputs are all non-empty: tc196 has a reseed, tg3 tc31 prediction resistance. */
export const SABOTAGE_BASES = ['acvp-tg14-tc196', 'acvp-tg3-tc31']

/**
 * Run every pinned vector, then re-run one-bit variants of the entropy input,
 * nonce, personalization string, additional input, reseed material and
 * prediction-resistance entropy. Every variant must NOT match, or the check
 * proves nothing about that input.
 */
export async function runKatWithSabotage(file?: KatVectorFile): Promise<KatRun> {
  const startedAt = new Date().toISOString()
  const { cases, _provenance } = file ?? (await loadKatVectorFile())
  const outcomes = await runHmacDrbgKatSuite(cases)
  const variants = cases
    .filter((c) => SABOTAGE_BASES.includes(c.id))
    .flatMap((c) => sabotageVariants(c))
  const results = await runHmacDrbgKatSuite(variants.map((v) => v.mutated))
  return {
    outcomes,
    sabotage: variants.map((v, i) => ({
      caseId: v.caseId,
      input: v.input,
      matched: results[i].passed,
    })),
    sources: _provenance.sources,
    startedAt,
    finishedAt: new Date().toISOString(),
  }
}
