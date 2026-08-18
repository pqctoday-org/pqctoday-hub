// SPDX-License-Identifier: GPL-3.0-only
/**
 * Closed status-maturity enum for algorithm rows (WORKSTREAMS.md §WS-A).
 *
 * Replaces free-text status comparison — the old `matchesStatusFilter` /
 * `isDraftCandidate` treated anything not literally `'Candidate'` or
 * `'To Be Checked'` as `'Certified'`, so NIST Additional-Sig Round-2
 * candidates, IETF Internet-Drafts, SP 800-230 drafts, the eliminated LAC
 * scheme, and the two NGCC placeholder rows all silently passed the default
 * "Certified" filter. Both loaders (`pqcAlgorithmsData.ts`,
 * `algorithmsData.ts`) now attach one of these tiers to every row via an
 * explicit lookup table that throws on any raw status string it doesn't
 * recognise — a future CSV snapshot with a new status string fails the
 * local build/test instead of silently reclassifying as "Certified".
 */
export type AlgorithmStatusTier =
  | 'final' // published FIPS/SP/RFC/ISO/ETSI standard
  | 'fips-draft' // NIST FIPS in development, not yet final (FN-DSA/FIPS 206 announced — no public draft published yet; HQC pre-FIPS-number)
  | 'sp-draft' // NIST Special Publication in draft (e.g. SP 800-230 parameter sets)
  | 'ietf-draft' // an Internet-Draft, not yet an RFC
  | 'round2-candidate' // NIST Additional Signatures Round 2 (MAYO, CROSS, UOV, SNOVA, etc.)
  | 'round4-not-selected' // concluded and not selected (BIKE)
  | 'eliminated' // publicly broken, withdrawn, or a lost national competition (LAC)
  | 'regional' // final within its own jurisdiction (KpqC/BSI winners), not FIPS-Certified
  | 'placeholder' // a program track name with no algorithm selected yet (NGCC)
  // Not part of WS-A's original 9-tier list — added because the raw CSV
  // status 'To Be Checked' / 'Research' means "not yet fact-checked", a
  // data-quality state distinct from any real standards-track tier above.
  // Treating it as e.g. round2-candidate would assert a standards claim
  // the data doesn't actually support.
  | 'unverified'
  // Added 2026-08-16 (sr25519/Schnorrkel): genuinely outside any standards
  // pipeline, not a draft OF one. Distinct from 'unverified' — the status
  // IS fact-checked (against w3f/schnorrkel's own PUBLIC_KEY_LENGTH/
  // SIGNATURE_LENGTH source constants), it just has no FIPS/IETF/regional
  // track to be a candidate/draft/regional-winner within. Using 'unverified'
  // would render its tooltip's literal "not yet fact-checked against an
  // authoritative source" — false for a row that was.
  | 'non-standardized'

/** Default "Certified" filter whitelist — everything else, including
 *  'placeholder', is excluded from the default view. Drives the green
 *  "success" badge/sort order (AlgorithmComparison, MobileTransitionWizard,
 *  MobileAlgorithmList) and the Playground's Draft-badge suppression
 *  (algorithmPickerStatus.tsx) — keep this strict to genuinely-final tiers,
 *  since widening it would hide the Draft warning on a pre-final algorithm
 *  in the key-generation picker. */
const CERTIFIED_TIERS: ReadonlySet<AlgorithmStatusTier> = new Set(['final', 'regional'])

export function isCertifiedTier(tier: AlgorithmStatusTier): boolean {
  return CERTIFIED_TIERS.has(tier)
}

/** Draft/Candidate badge condition — anything not whitelisted as Certified. */
export function isDraftTier(tier: AlgorithmStatusTier): boolean {
  return !isCertifiedTier(tier)
}

/** Status-filter "Certified" dropdown bucket (Transition Guide / Detailed
 *  Comparison default view) — one tier broader than CERTIFIED_TIERS:
 *  'fips-draft' (HQC, FN-DSA) is already NIST-selected, just pre-publication,
 *  so hiding it from the default view misleads migration planning — see
 *  personaConfig.ts's executive `highlight` list, which already names
 *  FN-DSA-512 as a headline algorithm the old default silently hid.
 *  Deliberately NOT reused for the badge/sort/Playground call sites above:
 *  those must keep showing "Draft" on fips-draft rows even though this
 *  filter now surfaces them by default. */
const STATUS_FILTER_TIERS: ReadonlySet<AlgorithmStatusTier> = new Set([
  'final',
  'regional',
  'fips-draft',
])

export function isStatusFilterTier(tier: AlgorithmStatusTier): boolean {
  return STATUS_FILTER_TIERS.has(tier)
}
