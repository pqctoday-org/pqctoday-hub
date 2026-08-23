// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSVAsync, parseIntOrNull } from './csvUtils'
import type { AlgorithmStatusTier } from './algorithmStatusTier'

export const RESEARCH_NEEDED = 'Research needed'

export interface AlgorithmDetail {
  family: string
  name: string
  cryptoFamily: string
  securityLevel: number | null
  aesEquivalent: string
  publicKeySize: number
  privateKeySize: number
  signatureCiphertextSize: number | null
  sharedSecretSize: number | null
  keyGenCycles: string
  signEncapsCycles: string
  verifyDecapsCycles: string
  stackRAM: number
  optimizationTarget: string
  fipsStandard: string
  useCaseNotes: string
  region: string
  status: string
  statusUrl?: string
  /** Normalized status-maturity tier — see WORKSTREAMS.md §WS-A / algorithmStatusTier.ts. */
  statusTier: AlgorithmStatusTier
  type:
    | 'KEM'
    | 'Signature'
    | 'Hybrid KEM'
    | 'Classical KEM'
    | 'Classical Sig'
    | 'Classical Symmetric'
    | 'Classical Hash'
    | 'Block Cipher'
    | 'Hash'
  /** True when any user-facing field equals "Research needed" — entry is incomplete and not yet researched. */
  hasResearchGap: boolean
  /** True when at least one numeric size field is unknown (parsed as 0 from "Research needed" or similar). */
  sizesUnknown: boolean
  /** True when the cycle/perf strings contain "Research needed". */
  perfUnknown: boolean
  confidenceScore?: number
}

/**
 * True when the raw CSV cell indicates the value has not been researched yet.
 * Used to display "Research needed" in the UI instead of NaN/0/empty.
 */
export function isResearchNeeded(rawValue: string | undefined | null): boolean {
  if (!rawValue) return false
  return rawValue.trim().toLowerCase() === RESEARCH_NEEDED.toLowerCase()
}

interface RawAlgorithmRow {
  algorithm_family: string
  algorithm: string
  cryptographic_family: string
  nist_security_level: string
  aes_equivalent: string
  public_key_bytes: string
  private_key_bytes: string
  signature_ciphertext_bytes: string
  shared_secret_bytes: string
  keygen_cycles_relative: string
  sign_encaps_cycles_relative: string
  verifydecaps_cycles_relative: string
  stack_ram_bytes: string
  optimization_target: string
  fips_standard: string
  use_case_notes: string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
  region: string
  status: string
  status_url: string
  status_url_quality: string
  confidence_score?: string
}

/**
 * Reference-CSV status/fips_standard → tier lookup (WORKSTREAMS.md §WS-A).
 *
 * A raw `status` value alone is ambiguous — e.g. `'Candidate'` alone covers
 * HQC (fips-draft), BIKE (round4-not-selected), FN-DSA (fips-draft), the
 * hybrid-TLS IETF groups (ietf-draft), the KpqC winners (regional), and the
 * NIST Additional-Sig Round 2 candidates all at once — so the key here is
 * the exact (status, fips_standard) pair as it literally appears in the CSV,
 * enumerated by hand against `pqc_complete_algorithm_reference_07062026.csv`.
 * Reconfirm this table against the actual wired filename if it changes.
 *
 * SMAUG-T/NTRU+/HAETAE/AIMer (KpqC) are tiered 'regional' — these four are
 * the final KpqC competition winners, officially announced 2025-01-16 at
 * https://www.kpqc.or.kr/competition_02.html (verified 2026-08-08, direct
 * fetch of the official page — supersedes the earlier PQShield-sourced
 * verification). Until 2026-08-08 this CSV's own fips_standard text still
 * said "KR-PQC Round 1 (KPQC)", which was wrong on two counts: they are
 * final winners, not Round 1 candidates, and Round 1 was Nov 2022, two
 * rounds before the Jan 2025 final selection. Note these are NOT yet a
 * published Korean national standard (KS) — the official page only
 * confirms competition selection; a secondary source (postquantum.com)
 * reports a KS draft expected 2026 and final ~2027, not independently
 * re-verified against a primary source this pass.
 *
 * Aigis-enc/Aigis-sig were ALSO tagged "KR-PQC Round 1 (KPQC)" until
 * 2026-08-07, but that was an outright misclassification, not staleness —
 * they're CACR (China) 2020 competition winners with no KpqC connection at
 * all (the CSV's own use_case_notes/vetting_body/region already said
 * "CACR"/China; only fips_standard/status_url/trusted_source_id were
 * wrong). See ALGORITHMS-AIGIS-CACR-MISCLASSIFICATION-REMEDIATION-PLAN-08072026.md
 * in pqctoday-priv/maintenance/ for the full verification trail.
 */
const REFERENCE_STATUS_TIER_LOOKUP: Record<string, AlgorithmStatusTier> = {
  'FIPS 203|||FIPS 203': 'final',
  'FIPS 204|||FIPS 204': 'final',
  'FIPS 205|||FIPS 205': 'final',
  'FIPS 186-5|||SP 800-56A': 'final',
  'FIPS 186-5|||RFC 7748': 'final',
  'FIPS 186-5|||FIPS 186': 'final',
  'FIPS 186-5|||RFC 8032': 'final',
  'SP 800-208|||NIST SP 800-208': 'final',
  'SP 800-56B|||SP 800-56B': 'final',
  'RFC 7919|||RFC 7919': 'final',
  'SEC 2|||SEC 2': 'final',
  'ISO 18033-2 Amd2|||NIST Round 3 alternate (not advanced); BSI/ANSSI & ISO 18033-2 recommended':
    'final',
  'Standardised (ETSI TS 104 015)|||ETSI TS 104 015 (published Feb 2025)': 'final',
  // ADDED 2026-08-22 with six catalogue rows for algorithms the enrichment
  // legitimately names and the reference CSV lacked. This guard caught them
  // immediately and said exactly what to do — the whole point of it.
  //
  // The four NIST Round 3 rejects are 'eliminated', not 'round4-not-selected':
  // that tier means a concluded Round 4 (BIKE), and these lost in Round 3.
  // Rainbow and GeMSS additionally fell to cryptanalysis, which is the same
  // tier for a different reason and is spelled out in each row's own status.
  'NIST Round 3 finalist — no longer being considered (NIST IR 8413-upd1 §4.3.4)|||': 'eliminated', // Saber — Kyber selected instead
  'NIST Round 3 finalist — no longer being considered (NIST IR 8413-upd1 §4.5.3); BROKEN — do not deploy|||':
    'eliminated', // Rainbow — Beullens cryptanalysis of UOV/Rainbow
  'NIST Round 3 alternate — no longer being considered (NIST IR 8413-upd1 §4.5.2)|||': 'eliminated', // Picnic
  'NIST Round 3 alternate — no longer being considered (NIST IR 8413-upd1 §4.5.1)|||': 'eliminated', // GeMSS — an attack dramatically reduced its security
  // Ascon is a PUBLISHED standard, hence 'final' — but it is lightweight
  // symmetric crypto, not post-quantum public-key. The row's own status says so
  // rather than leaving a reader to infer it from the tier badge.
  'SP 800-232 (standardised) — lightweight symmetric, NOT a post-quantum public-key algorithm|||SP 800-232':
    'final', // Ascon-AEAD128, Ascon-Hash256
  'Candidate|||Draft (Selected 2025)': 'fips-draft', // HQC
  // FN-DSA: FIPS 206 is announced/in development — NO public draft exists yet
  // (csrc.nist.gov is the source of truth; the ipd URL 404s). Tier stays
  // 'fips-draft' (the NIST-FIPS-pipeline tier HQC also uses) — see
  // algorithmStatusTier.ts for the honest tier description.
  'Candidate|||FIPS 206 (in development)': 'fips-draft', // FN-DSA (07092026 snapshot)
  'Candidate|||FIPS 206 (Draft)': 'fips-draft', // FN-DSA (legacy ≤07082026 snapshots)
  'Draft|||NIST SP 800-230 (Draft)': 'sp-draft', // SLH-DSA-*-24
  'Candidate|||draft-ietf-tls-hybrid-design': 'ietf-draft', // X25519MLKEM768 etc.
  'IETF Internet-Draft|||IETF Internet-Draft — DRAFT (not yet RFC)': 'ietf-draft', // pre-08072026 snapshots
  'IETF Internet-Draft|||IETF Internet-Draft — In RFC Editor queue (not yet published, v19, 2026-04-21)':
    'ietf-draft', // composite-sigs — passed IESG review, in RFC Editor queue, still not an RFC
  'IETF Internet-Draft (alias for HPKE with PQ KEM)|||IETF Internet-Draft — DRAFT (not yet RFC)':
    'ietf-draft', // HPKE-PQ
  'Candidate|||NIST Additional Signatures Round 2': 'round2-candidate', // MAYO, HAWK (pre-2026-07-27 snapshots)
  'NIST Additional Sig Round 2 — Candidate|||NIST Additional Sig — Round 2 candidate (NOT standardised)':
    'round2-candidate', // UOV, CROSS, LESS, FAEST, SNOVA (pre-2026-07-27 snapshots)
  'NIST Additional Sig Round 2 — Candidate (SQIsign-I)|||NIST Additional Sig — Round 2 candidate (NOT standardised)':
    'round2-candidate', // SQIsign (pre-2026-07-27 snapshots)
  // 2026-07-27: 9 of these confirmed advanced to Round 3 (csrc.nist.gov's own
  // announcement) — status text bumped, fips_standard column left as-is (still
  // literally says "Round 2" — a separate, lower-priority cleanup). CROSS/LESS
  // did NOT advance; status now says so explicitly instead of the stale
  // "Round 2 — Candidate" text. No new UI tier needed for any of these — Round
  // 3 candidacy and Round-2-eliminated are both still 'round2-candidate' in
  // maturity terms (not yet standardised either way); a real 'round3-candidate'
  // / 'eliminated'-for-these-specific-rows tier is future work, not this fix's
  // job — this table's only contract is "don't crash the build."
  'NIST Additional Sig Round 3 — Candidate|||NIST Additional Signatures Round 2':
    'round2-candidate', // MAYO-1/2/3/5, HAWK-512/1024
  'NIST Additional Sig Round 3 — Candidate|||NIST Additional Sig — Round 2 candidate (NOT standardised)':
    'round2-candidate', // UOV, FAEST, SNOVA
  'NIST Additional Sig Round 3 — Candidate (SQIsign-I)|||NIST Additional Sig — Round 2 candidate (NOT standardised)':
    'round2-candidate', // SQIsign
  'NIST Additional Sig Round 2 — Eliminated (did not advance to Round 3, 2026-05)|||NIST Additional Sig — Round 2 candidate (NOT standardised)':
    'eliminated', // CROSS, LESS
  'NIST Additional Sig Round 3 — Candidate|||': 'round2-candidate', // MQOM, QR-UOV, SDitH — new
  // stub rows (2026-07-27), fips_standard genuinely blank (add_row.py leaves it for human
  // follow-up rather than guessing). The status itself IS verified (csrc.nist.gov's own
  // Round 3 announcement), so 'round2-candidate' (matching the other 9 Round 3 candidates
  // above) is the honest tier — 'unverified' would misrepresent the one fact that actually
  // is confirmed here.
  'Candidate|||NIST PQC Round 4 (concluded 2025; not selected)': 'round4-not-selected', // BIKE
  'BSI TR-02102-1|||NIST PQC Round 4 (Alternate)': 'regional', // Classic-McEliece
  'Standardised (BSI TR-02102-1)|||BSI TR-02102-1 (recommended Level 5); NOT in NIST FIPS':
    'regional',
  'Standardised (BSI TR-02102-1)|||BSI/conservative national security recs; NOT in NIST FIPS':
    'regional',
  // Classic-McEliece upgraded to 'final' 2026-07-27: ISO/IEC 18033-2:2006/Amd 2:2026
  // formally standardized it internationally (iso.org/standard/86890.html), on top of
  // the pre-existing BSI TR-02102-1 national recommendation — status text now carries
  // both facts ("; "-joined, matching this CSV's existing multi-fact convention, e.g.
  // the LAC row below). 'final' means "published FIPS/SP/RFC/ISO/ETSI standard", which
  // this now genuinely is; 'regional' would understate it.
  'ISO 18033-2 Amd2; BSI TR-02102-1|||NIST PQC Round 4 (Alternate)': 'final',
  'ISO 18033-2 Amd2; Standardised (BSI TR-02102-1)|||BSI TR-02102-1 (recommended Level 5); NOT in NIST FIPS':
    'final',
  'ISO 18033-2 Amd2; Standardised (BSI TR-02102-1)|||BSI/conservative national security recs; NOT in NIST FIPS':
    'final',
  'Candidate|||KR-PQC Round 1 (KPQC)': 'regional', // SMAUG-T/NTRU+/HAETAE/AIMer (pre-08082026 snapshots)
  'Candidate|||KpqC competition winner, announced 2025-01-16 — KS national standard TBD (draft expected 2026, final ~2027)':
    'regional', // SMAUG-T/NTRU+/HAETAE/AIMer — corrected 2026-08-08, was mislabeled "Round 1"
  'To Be Checked|||CACR 1st Prize (2020, China) — PKC 2020 (Zhang et al.); NOT an adopted national/international standard':
    'unverified', // Aigis-enc/sig — corrected 2026-08-07 from a mistaken KpqC/Korea tag
  'CACR competition winner (2020); ELIMINATED from NIST Round 2 (not advanced); NOT an adopted national standard — do not treat as deployable|||CACR national competition winner (as LAC.KEX, ~2018-2020) — NOT an issued OSCCA/GB national standard':
    'eliminated', // LAC
  'CONFIRMED PLACEHOLDER — official ICCS program track name (Block Cipher category); no winning algorithm selected yet|||NGCC TBD — submission window open, candidates not yet selected':
    'placeholder', // NGCC-BC
  'CONFIRMED PLACEHOLDER — official ICCS program track name (Cryptographic Hash category); no winning algorithm selected yet|||NGCC TBD — submission window open, candidates not yet selected':
    'placeholder', // NGCC-CH
  // --- Hybrid KEM mechanisms (added 2026-07-28) -----------------------------
  // Until now the catalogue's only hybrids were the three TLS named groups, so
  // hybrid coverage was implicitly scoped to "TLS wire construction". These
  // entries extend it to general-purpose, SSH and X.509/CMS composite hybrids.
  // This lookup failing closed is what caught the omission — adding rows without
  // registering their status pair throws rather than defaulting to Certified.
  'Candidate|||draft-connolly-cfrg-xwing-kem': 'ietf-draft', // X-Wing
  'Candidate|||draft-ietf-sshm-mlkem-hybrid-kex': 'ietf-draft', // SSH ML-KEM hybrids
  'Candidate|||draft-ietf-lamps-pq-composite-kem-16': 'ietf-draft', // Composite ML-KEM (pre-08072026 snapshots)
  'Candidate|||draft-ietf-lamps-pq-composite-kem-18': 'ietf-draft', // Composite ML-KEM — draft bumped to -18 (2026-07-23), still IESG "Waiting for AD Go-Ahead"
  // -19 posted 2026-08-14; IESG state moved to "IESG Evaluation" on 2026-08-13
  // and it is on the 2026-09-03 telechat agenda. Verified against the
  // datatracker 2026-08-17. Older keys above are retained deliberately: this
  // lookup throws on an unregistered pair, so the key must exist BEFORE the
  // CSV bumps to -19, and archived CSV snapshots still carry -16/-18.
  'Candidate|||draft-ietf-lamps-pq-composite-kem-19': 'ietf-draft', // Composite ML-KEM
  // BLS12-381 (2026-08-16): draft-irtf-cfrg-bls-signature is an active
  // IRTF CFRG Internet-Draft, verified against the datatracker directly —
  // not yet an RFC.
  'Active Internet-Draft|||draft-irtf-cfrg-bls-signature': 'ietf-draft',
  // RFC 9941 is a published RFC, so `final` — matching how RFC 7919 is treated.
  // The sntrup761 COMPONENT is a NIST round-3 alternate rather than a FIPS
  // algorithm, but the tier describes the standards status of the mechanism
  // named by the row, and this one is standards-track and published.
  'RFC 9941|||RFC 9941': 'final', // sntrup761x25519-sha512
  // sr25519 (2026-08-16): a Web3 Foundation (Schnorrkel) implementation, not
  // an IETF/NIST/regional standards-track document at all — 'non-standardized'
  // (not 'unverified', whose tooltip claims the status wasn't fact-checked;
  // this one was, against w3f/schnorrkel's own source constants).
  'Active|||W3F Schnorrkel implementation; NOT an IETF/NIST standard': 'non-standardized',
  // SM2 (2026-08-16): a real published standard (GB/T 32918, ISO/IEC
  // 14888-3:2018) — 'regional' (final within its own jurisdiction, not a
  // NIST FIPS), same tier China/KpqC national winners already use.
  'Published|||GB/T 32918 (China); ISO/IEC 14888-3:2018; NOT in NIST FIPS': 'regional',
}

/** Throws on any (status, fips_standard) pair not in the lookup table above —
 *  fail closed instead of silently defaulting a new/unrecognised CSV status
 *  to "Certified" (the exact bug this enum replaces). */
export function mapReferenceStatusToTier(
  status: string,
  fipsStandard: string
): AlgorithmStatusTier {
  const key = `${status}|||${fipsStandard}`
  const tier = REFERENCE_STATUS_TIER_LOOKUP[key]
  if (!tier) {
    throw new Error(
      `[pqcAlgorithmsData] Unrecognized (status, fips_standard) pair: ${JSON.stringify(status)} / ${JSON.stringify(fipsStandard)}. ` +
        'Add it to REFERENCE_STATUS_TIER_LOOKUP in pqcAlgorithmsData.ts.'
    )
  }
  return tier
}

// Import CSV data dynamically (lazy glob)
const csvModule = import.meta.glob('./pqc_complete_algorithm_reference_*.csv', {
  query: '?raw',
  import: 'default',
})

let cachedData: AlgorithmDetail[] | null = null
export let loadedFileMetadata: { filename: string; date: Date | null } | null = null

// Helper to extract date from filename — exported for use by algorithmsData.ts
export function getDateFromFilename(path: string): Date | null {
  const match = path.match(/_(\d{8})(?:_r\d+)?\.csv$/)
  if (!match) return null

  const dateStr = match[1]
  const month = parseInt(dateStr.substring(0, 2)) - 1 // JS months are 0-indexed
  const day = parseInt(dateStr.substring(2, 4))
  const year = parseInt(dateStr.substring(4, 8))

  const date = new Date(year, month, day)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }

  return date
}

export function getRevisionFromFilename(path: string): number {
  const match = path.match(/_\d{8}_r(\d+)\.csv$/)
  return match ? parseInt(match[1], 10) : 0
}

export async function loadPQCAlgorithmsData(): Promise<AlgorithmDetail[]> {
  if (cachedData) return cachedData

  const { data, metadata } = await loadLatestCSVAsync<RawAlgorithmRow, AlgorithmDetail>(
    csvModule,
    /pqc_complete_algorithm_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    (row) => {
      const statusTier = mapReferenceStatusToTier(row.status || '', row.fips_standard || '')
      // NGCC-BC/NGCC-CH are a program track name with no algorithm selected
      // yet (confirmed by the CSV's own data-quality note) — not a real
      // algorithm to show in a user-facing comparison. Drop the row rather
      // than badge it, per WORKSTREAMS.md §WS-A step 4.
      if (statusTier === 'placeholder') return null

      const sizesUnknown =
        isResearchNeeded(row.public_key_bytes) ||
        isResearchNeeded(row.private_key_bytes) ||
        isResearchNeeded(row.signature_ciphertext_bytes)
      const perfUnknown =
        isResearchNeeded(row.keygen_cycles_relative) ||
        isResearchNeeded(row.sign_encaps_cycles_relative) ||
        isResearchNeeded(row.verifydecaps_cycles_relative)
      const hasResearchGap =
        sizesUnknown ||
        perfUnknown ||
        isResearchNeeded(row.nist_security_level) ||
        isResearchNeeded(row.aes_equivalent) ||
        isResearchNeeded(row.stack_ram_bytes) ||
        isResearchNeeded(row.optimization_target) ||
        isResearchNeeded(row.shared_secret_bytes)

      return {
        family: row.algorithm_family,
        name: row.algorithm,
        // P2.1 (2026-05-22): bare 'Hybrid' was renamed to 'Composite' to
        // disambiguate from protocol-level "hybrid signature" (different
        // concept). Older CSV snapshots ship with 'Hybrid', so the loader
        // normalises both spellings to the canonical 'Composite' value.
        // Compound labels (e.g. 'Hybrid (KEM + ABE)', 'Framework (Hybrid
        // PKE)') are unaffected — only the exact 'Hybrid' string is mapped.
        cryptoFamily:
          row.cryptographic_family === 'Hybrid' ? 'Composite' : row.cryptographic_family || '',
        securityLevel: parseIntOrNull(row.nist_security_level),
        aesEquivalent: row.aes_equivalent,
        publicKeySize: parseInt(row.public_key_bytes, 10) || 0,
        privateKeySize: parseInt(row.private_key_bytes, 10) || 0,
        signatureCiphertextSize: parseIntOrNull(row.signature_ciphertext_bytes),
        sharedSecretSize: parseIntOrNull(row.shared_secret_bytes),
        keyGenCycles: row.keygen_cycles_relative,
        signEncapsCycles: row.sign_encaps_cycles_relative,
        verifyDecapsCycles: row.verifydecaps_cycles_relative,
        stackRAM: parseInt((row.stack_ram_bytes || '0').replace(/[~,]/g, ''), 10) || 0,
        optimizationTarget: row.optimization_target,
        fipsStandard: row.fips_standard,
        useCaseNotes: row.use_case_notes || '',
        region: row.region || '',
        status: row.status || '',
        statusUrl: row.status_url || undefined,
        statusTier,
        type: row.algorithm_family as AlgorithmDetail['type'],
        hasResearchGap,
        sizesUnknown,
        perfUnknown,
        confidenceScore: row.confidence_score ? Number(row.confidence_score) : undefined,
      }
    }
  )

  loadedFileMetadata = metadata ? { filename: metadata.filename, date: metadata.lastUpdate } : null

  cachedData = data
  return data
}

// Helper functions for categorization
export function isPQC(algo: AlgorithmDetail): boolean {
  return algo.family === 'KEM' || algo.family === 'Signature'
}

export function isHybrid(algo: AlgorithmDetail): boolean {
  return algo.family === 'Hybrid KEM'
}

export function isClassical(algo: AlgorithmDetail): boolean {
  return (
    algo.family === 'Classical KEM' ||
    algo.family === 'Classical Sig' ||
    algo.family === 'Classical Symmetric' ||
    algo.family === 'Classical Hash'
  )
}

export function getPerformanceCategory(cycles: string): 'Fast' | 'Moderate' | 'Slow' | 'Unknown' {
  if (isResearchNeeded(cycles)) return 'Unknown'
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 'Moderate'

  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  if (!match) return 'Moderate'

  const multiplier = parseFloat(match[1])

  if (multiplier <= 1) return 'Fast'
  if (multiplier <= 10) return 'Moderate'
  return 'Slow'
}

export function getSecurityLevelColor(level: number | null): string {
  if (level === null) return 'bg-muted/50 text-muted-foreground border-border'
  if (level === 1) return 'bg-primary/10 text-primary border-primary/30'
  if (level === 2) return 'bg-accent/10 text-accent border-accent/30'
  if (level === 3) return 'bg-success/10 text-success border-success/30'
  if (level === 4) return 'bg-warning/10 text-warning border-warning/30'
  return 'bg-destructive/10 text-destructive border-destructive/30' // Level 5
}

export function getPerformanceColor(category: 'Fast' | 'Moderate' | 'Slow' | 'Unknown'): string {
  if (category === 'Fast') return 'bg-success/10 text-success border-success/30'
  if (category === 'Moderate') return 'bg-warning/10 text-warning border-warning/30'
  if (category === 'Unknown') return 'bg-muted/50 text-muted-foreground border-border italic'
  return 'bg-destructive/10 text-destructive border-destructive/30'
}

export function getCryptoFamilyColor(family: string): string {
  switch (family) {
    case 'Lattice':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'Code-based':
      return 'bg-accent/10 text-accent border-accent/30'
    case 'Hash-based':
      return 'bg-success/10 text-success border-success/30'
    case 'Composite':
      return 'bg-warning/10 text-warning border-warning/30'
    case 'Classical':
      return 'bg-muted/50 text-muted-foreground border-border'
    default:
      return 'bg-muted/50 text-muted-foreground border-border'
  }
}

/** Determine the functional group of an algorithm: 'KEM' or 'Signature' */
export function getFunctionGroup(
  algo: AlgorithmDetail
): 'KEM' | 'Signature' | 'Hash' | 'Symmetric' | null {
  if (algo.family === 'KEM' || algo.family === 'Classical KEM' || algo.family === 'Hybrid KEM')
    return 'KEM'
  if (algo.family === 'Signature' || algo.family === 'Classical Sig') return 'Signature'
  if (algo.family === 'Classical Hash') return 'Hash'
  if (algo.family === 'Classical Symmetric') return 'Symmetric'
  return null
}
