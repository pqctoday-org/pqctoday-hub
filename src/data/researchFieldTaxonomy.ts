// SPDX-License-Identifier: GPL-3.0-only
import { splitSemicolon } from './csvUtils'
import {
  canonicalAlgorithmFamily,
  ALGORITHM_FAMILIES,
} from '@/components/common/AlgorithmFamilyFilter'
import type { AlgorithmFamily } from '@/components/common/AlgorithmFamilyFilter'

/**
 * researchFieldTaxonomy — the "fields a researcher can follow" bucket list for
 * the Researcher persona's field-watch card (IMPLEMENTATION-PLAN-2026-08-01.md
 * §6). This is the one genuinely new piece of information architecture in the
 * whole persona-journeys redesign — an editorial judgment call, not a
 * mechanical derivation — and should be reviewed as such.
 *
 * DESIGN DECISION (read before revising): the library CSV's `AlgorithmFamily`
 * column is free text — semicolon-joined multi-values, ~40% blank, and a very
 * long tail of one-off phrasings (261 distinct raw values measured against
 * `library_07312026_r2.csv`, e.g. "Lattice-based", "Lattice-based (NTRU)",
 * "Lattice+ECDH", "ML-KEM; ML-DSA", "RSA;ECDSA;ECDH;AES;SHA;ML-KEM;ML-DSA;
 * SLH-DSA;FN-DSA"). Rather than inventing a SECOND normalizer for this same
 * messy column, this file reuses `canonicalAlgorithmFamily` from
 * `@/components/common/AlgorithmFamilyFilter` — the Library page's existing
 * algorithm-family filter facet, which already does exactly this
 * normalization (raw token → one of 9 canonical families) and is already
 * exercised in production against this exact column. Reuse avoids two
 * taxonomies for the same field silently drifting apart over time. (This
 * codebase already has precedent for a `src/data/*` module importing a
 * matcher from a `src/components/**\/*Filter.tsx` file — see
 * `timelineScope.ts` → `CategoryFilter`/`TrustTierFilter`.)
 *
 * What THIS file adds on top of the reused classifier:
 *  1. A documented "Other / Uncategorized" fallback bucket — `canonicalAlgorithmFamily`
 *     returns `null` for blank/unrecognized tokens (by design, for a filter that
 *     should just exclude non-matches); a follow-list needs every row to land
 *     somewhere so the "since last visit" counts stay honest about how much of
 *     the corpus isn't cleanly classified. Measured against the real CSV:
 *     ~43% of rows (blank AlgorithmFamily + a handful of non-family free text
 *     like "Guidelines", "Various", "N/A") land here.
 *  2. Researcher-facing labels/descriptions for each bucket (the filter only
 *     needed a label for a dropdown option; a follow list benefits from one
 *     sentence of "what this covers").
 *  3. `mapAlgorithmFamilyToFields`, which — unlike the filter's per-token
 *     `canonicalAlgorithmFamily` — takes the WHOLE raw column value, splits it
 *     on `;` (reusing `splitSemicolon`, the same helper `libraryData.ts` uses —
 *     no second CSV/string parser here either), classifies every token, and
 *     returns the full set of buckets that row belongs to (a row can and often
 *     does belong to more than one bucket, e.g. "ML-KEM; ML-DSA; SLH-DSA" is
 *     both Lattice-based and Hash-based).
 *
 * Bucket count: 9 real families (reused verbatim from `ALGORITHM_FAMILIES`) +
 * 1 fallback = 10 ids, inside the ~8-10 target range for this feature.
 *
 * NOT included as their own buckets, despite being suggested as examples in
 * the plan doc (§6.1) — "PKI & Protocols", "Compliance & Regulatory", "HSM &
 * Key Management", "Supply Chain": the `AlgorithmFamily` column genuinely
 * carries almost no signal for these (they're document-topic concerns, live
 * in `manual_category`/`document_type` instead, not in this column). Creating
 * buckets that would sit permanently empty against the real data would be
 * worse than not having them — flagging this explicitly per the plan's own
 * instruction to surface, not paper over, this kind of judgment call.
 */

/** A single row's `AlgorithmFamily` value may legitimately count toward more
 *  than one bucket (e.g. a hybrid or multi-value entry) — see `mapAlgorithmFamilyToFields`. */
export interface ResearchFieldBucket {
  id: string
  label: string
  /** One sentence: what a researcher following this bucket should expect. */
  description: string
}

/** Fallback bucket id for AlgorithmFamily values that are blank or don't
 *  cleanly classify into any of the 9 real families below. */
export const OTHER_FIELD_BUCKET_ID = 'other-uncategorized'

/** Stable slug id for each of the 9 reused `AlgorithmFamily` canonical values. */
const FAMILY_BUCKET_ID: Record<AlgorithmFamily, string> = {
  'Lattice-based': 'lattice-based',
  'Hash-based': 'hash-based',
  'Code-based': 'code-based',
  'Multivariate / MPCitH': 'multivariate-mpcith',
  'Isogeny-based': 'isogeny-based',
  Symmetric: 'symmetric',
  'QKD / Quantum': 'qkd-quantum',
  'Hybrid PQ/Classical': 'hybrid-pq-classical',
  'Classical (RSA/ECC)': 'classical-rsa-ecc',
}

const FAMILY_BUCKET_DESCRIPTION: Record<AlgorithmFamily, string> = {
  'Lattice-based':
    'ML-KEM, ML-DSA, Falcon/FN-DSA, Kyber, Dilithium, NTRU, FrodoKEM and other lattice-hardness schemes.',
  'Hash-based':
    'SLH-DSA, XMSS, LMS/HSS, SPHINCS+ and other hash-based signature schemes (stateful and stateless).',
  'Code-based': 'Classic McEliece, BIKE, HQC and other code-based schemes.',
  'Multivariate / MPCitH':
    'UOV, SNOVA, MAYO, MQOM, SDitH and other multivariate / MPC-in-the-Head signature candidates.',
  'Isogeny-based': 'SQIsign, SIKE/SIDH, CSIDH and other isogeny-based schemes.',
  Symmetric:
    'AES, SHA-2/3, HMAC, KDFs and other symmetric-key primitives (Grover margin, not a Shor break).',
  'QKD / Quantum': 'Quantum key distribution and other physical/quantum-channel approaches.',
  'Hybrid PQ/Classical':
    'Composite/hybrid combiners pairing a PQ algorithm with a classical one during transition.',
  'Classical (RSA/ECC)':
    'RSA, ECDSA/ECDH, Ed25519/X25519 and other classical public-key schemes being migrated away from.',
}

/**
 * The full, ordered bucket list a researcher can follow — the 9 reused
 * canonical families (in `ALGORITHM_FAMILIES` declared order) followed by the
 * fallback bucket. Order here is also the canonical/deterministic order
 * `mapAlgorithmFamilyToFields` returns matches in.
 */
export const RESEARCH_FIELD_BUCKETS: ResearchFieldBucket[] = [
  ...ALGORITHM_FAMILIES.map((family) => ({
    // eslint-disable-next-line security/detect-object-injection -- family is drawn from ALGORITHM_FAMILIES itself
    id: FAMILY_BUCKET_ID[family],
    label: family,
    // eslint-disable-next-line security/detect-object-injection -- family is drawn from ALGORITHM_FAMILIES itself
    description: FAMILY_BUCKET_DESCRIPTION[family],
  })),
  {
    id: OTHER_FIELD_BUCKET_ID,
    label: 'Other / Uncategorized',
    description:
      'Rows with a blank or unrecognized AlgorithmFamily value — not a designed topic, just the honest overflow bucket (~43% of the catalog today).',
  },
]

const RESEARCH_FIELD_BUCKET_IDS = new Set(RESEARCH_FIELD_BUCKETS.map((b) => b.id))

/** True when `id` is one of `RESEARCH_FIELD_BUCKETS`'s ids. */
export function isResearchFieldBucketId(id: string): boolean {
  return RESEARCH_FIELD_BUCKET_IDS.has(id)
}

/** Look up a bucket's label by id, or `undefined` if unknown. */
export function researchFieldBucketLabel(id: string): string | undefined {
  return RESEARCH_FIELD_BUCKETS.find((b) => b.id === id)?.label
}

/**
 * Map one library row's raw `AlgorithmFamily` CSV value to the set of
 * research-field bucket ids it belongs to. Splits on `;` (reusing
 * `splitSemicolon`, same helper `libraryData.ts` already uses), classifies
 * each token via the reused `canonicalAlgorithmFamily`, and returns the
 * distinct matched bucket ids in `RESEARCH_FIELD_BUCKETS` order. Blank input
 * or a value with no recognizable family token(s) returns `[OTHER_FIELD_BUCKET_ID]`
 * — every row lands in exactly one or more buckets, never zero.
 *
 * Pure function — no I/O, safe to unit test directly against real CSV values.
 */
export function mapAlgorithmFamilyToFields(raw: string): string[] {
  const tokens = splitSemicolon(raw)
  const matchedFamilies = new Set<AlgorithmFamily>()
  for (const token of tokens) {
    const family = canonicalAlgorithmFamily(token)
    if (family) matchedFamilies.add(family)
  }
  if (matchedFamilies.size === 0) return [OTHER_FIELD_BUCKET_ID]
  return ALGORITHM_FAMILIES.filter((f) => matchedFamilies.has(f)).map(
    // eslint-disable-next-line security/detect-object-injection -- f is drawn from ALGORITHM_FAMILIES itself
    (f) => FAMILY_BUCKET_ID[f]
  )
}
