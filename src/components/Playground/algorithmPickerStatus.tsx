// SPDX-License-Identifier: GPL-3.0-only
/**
 * Playground algorithm picker → `/algorithms` status enum (WORKSTREAMS.md §WS-A, item 1
 * of playground.md). Every algorithm-selection dropdown in the playground offers FN-DSA,
 * MAYO, CROSS, OV/UOV, SNOVA, HQC, FrodoKEM, and Classic McEliece as flat peers of the
 * finalized ML-KEM/ML-DSA/SLH-DSA — this maps each picker option to the same
 * `AlgorithmStatusTier` the `/algorithms` page reads from `pqcAlgorithmsData.ts`, so a
 * "Draft" badge appears here exactly where `/algorithms` shows one for the same algorithm.
 *
 * The reference CSV's granularity doesn't always match the picker's per-parameter-set
 * options (e.g. one bare "CROSS" / "SNOVA" / "UOV" row covers every parameter set the
 * picker lists individually) — `PICKER_ID_TO_ALGO_NAME` maps each picker option id to the
 * exact CSV `algorithm` name whose tier applies. `algorithmPickerStatus.test.ts` asserts
 * every mapped name actually resolves against the wired CSV, so a future rename fails the
 * local build instead of silently dropping the badge.
 */
import { useEffect, useState } from 'react'
import { loadPQCAlgorithmsData } from '../../data/pqcAlgorithmsData'
import { isDraftTier, type AlgorithmStatusTier } from '../../data/algorithmStatusTier'

/** Picker option id (as used in KeyGenerationSection's FilterDropdown) → exact CSV `algorithm` name. */
export const PICKER_ID_TO_ALGO_NAME: Record<string, string> = {
  // ML-KEM (KeyGenerationSection encodes these as bare key-size ids)
  '512': 'ML-KEM-512',
  '768': 'ML-KEM-768',
  '1024': 'ML-KEM-1024',
  // HQC
  'HQC-128': 'HQC-128',
  'HQC-192': 'HQC-192',
  'HQC-256': 'HQC-256',
  // FrodoKEM — CSV has one row per security level, no AES/SHAKE split
  'FrodoKEM-640-AES': 'FrodoKEM-640',
  'FrodoKEM-976-AES': 'FrodoKEM-976',
  'FrodoKEM-1344-AES': 'FrodoKEM-1344',
  'FrodoKEM-640-SHAKE': 'FrodoKEM-640',
  'FrodoKEM-976-SHAKE': 'FrodoKEM-976',
  'FrodoKEM-1344-SHAKE': 'FrodoKEM-1344',
  // Classic McEliece
  'Classic-McEliece-348864': 'Classic-McEliece-348864',
  'Classic-McEliece-460896': 'Classic-McEliece-460896',
  'Classic-McEliece-6688128': 'Classic-McEliece-6688128',
  'Classic-McEliece-6960119': 'Classic-McEliece-6960119',
  'Classic-McEliece-8192128': 'Classic-McEliece-8192128',
  // ML-DSA (bare security-level ids)
  '44': 'ML-DSA-44',
  '65': 'ML-DSA-65',
  '87': 'ML-DSA-87',
  // SLH-DSA (FIPS 205 final parameter sets — ids match CSV names exactly)
  'SLH-DSA-SHA2-128f': 'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHA2-128s': 'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-192f': 'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHA2-192s': 'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-256f': 'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHA2-256s': 'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHAKE-128f': 'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-128s': 'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-192f': 'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-192s': 'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-256f': 'SLH-DSA-SHAKE-256f',
  'SLH-DSA-SHAKE-256s': 'SLH-DSA-SHAKE-256s',
  // FN-DSA / Falcon — FIPS 206 still in development (no public draft); padded variants share the base tier
  'FN-DSA-512': 'FN-DSA-512',
  'FN-DSA-1024': 'FN-DSA-1024',
  'FN-DSA-padded-512': 'FN-DSA-512',
  'FN-DSA-padded-1024': 'FN-DSA-1024',
  // MAYO — NIST Additional Sig Round 2
  'MAYO-1': 'MAYO-1',
  'MAYO-2': 'MAYO-2',
  'MAYO-3': 'MAYO-3',
  'MAYO-5': 'MAYO-5',
  // CROSS — one CSV row covers every RSDP(g) parameter set
  'CROSS-RSDP-128-balanced': 'CROSS',
  'CROSS-RSDP-192-balanced': 'CROSS',
  'CROSS-RSDP-256-balanced': 'CROSS',
  'CROSS-RSDPg-128-balanced': 'CROSS',
  'CROSS-RSDPg-192-balanced': 'CROSS',
  'CROSS-RSDPg-256-balanced': 'CROSS',
  // OV / UOV — picker uses "OV-*" ids, CSV names the algorithm "UOV"
  'OV-Ip': 'UOV',
  'OV-Is': 'UOV',
  'OV-III': 'UOV',
  'OV-V': 'UOV',
  // SNOVA — one CSV row covers every parameter set
  'SNOVA-24-5-4': 'SNOVA',
  'SNOVA-29-6-5': 'SNOVA',
  'SNOVA-49-11-3': 'SNOVA',
  // LMS — one CSV row (stateful hash-based, SP 800-208, final) covers every H value
  'LMS-SHA256-H10': 'LMS-SHA256 (H20/W8)',
  'LMS-SHA256-H15': 'LMS-SHA256 (H20/W8)',
  'LMS-SHA256-H20': 'LMS-SHA256 (H20/W8)',
}

/** Loads the `/algorithms` reference data once and exposes a name → tier lookup. */
export function useAlgorithmStatusTiers(): Map<string, AlgorithmStatusTier> {
  const [tiers, setTiers] = useState<Map<string, AlgorithmStatusTier>>(new Map())

  useEffect(() => {
    let cancelled = false
    loadPQCAlgorithmsData().then((rows) => {
      if (cancelled) return
      setTiers(new Map(rows.map((r) => [r.name, r.statusTier])))
    })
    return () => {
      cancelled = true
    }
  }, [])

  return tiers
}

/** Resolves a picker option id to its status tier, or undefined until data has loaded / if unmapped. */
export function getPickerTier(
  id: string,
  tiers: Map<string, AlgorithmStatusTier>
): AlgorithmStatusTier | undefined {
  const algoName = PICKER_ID_TO_ALGO_NAME[id]
  if (!algoName) return undefined
  return tiers.get(algoName)
}

/**
 * Novice-friendly "what is this" note per tier (playground.md item 5) — explains the
 * algorithm's role rather than assuming the reader already knows what e.g. "NIST
 * Additional Sig Round 2" implies. Shown as the badge's tooltip so it piggybacks on
 * the same UI element from item 1 instead of adding a second one.
 */
const TIER_ROLE_NOTE: Partial<Record<AlgorithmStatusTier, string>> = {
  'fips-draft':
    'NIST has selected this algorithm and is developing the FIPS standard — no public draft has been published yet; sizes/parameters can still change.',
  'sp-draft':
    'Defined in a draft NIST Special Publication, not yet final — sizes/parameters can still change.',
  'ietf-draft': 'Defined in an IETF Internet-Draft — not yet a published RFC.',
  'round2-candidate':
    'A backup signature candidate still under NIST evaluation (Additional Signatures Round 2) — not a primary standard like ML-KEM/ML-DSA.',
  'round4-not-selected':
    'A concluded NIST PQC Round 4 candidate that was not selected as a standard.',
  eliminated: 'Publicly broken, withdrawn, or lost a national competition — do not deploy.',
  regional:
    'A national/regional standard (e.g. BSI, KpqC) — final within that jurisdiction, but not a NIST FIPS.',
  unverified: 'Status not yet fact-checked against an authoritative source.',
  'non-standardized':
    'Not on any FIPS/IETF/regional standards track — an actively-maintained implementation, not a certified or draft standard.',
}

/**
 * Draft/candidate badge for algorithm picker options — same visual language as the
 * `/algorithms` page's DraftBadge (`AlgorithmDetailedComparison.tsx`), shown for any
 * tier other than 'final'/'regional'. Tooltip explains the algorithm's role per tier
 * (playground.md item 5) rather than a generic "Draft" label.
 */
export function PickerDraftBadge({ tier }: { tier: AlgorithmStatusTier | undefined }) {
  if (!tier || !isDraftTier(tier)) return null
  const note =
    TIER_ROLE_NOTE[tier] ??
    'Draft or candidate standard — sizes and parameters may change before finalization'
  return (
    <span
      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning border border-status-warning/30 font-medium ml-auto shrink-0"
      title={note}
    >
      Draft
    </span>
  )
}
