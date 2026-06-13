// SPDX-License-Identifier: GPL-3.0-only
//
// CNSA 2.0 classification engine for the Algorithms page (Wave-5 gap-closers).
//
// The NSA Commercial National Security Algorithm Suite 2.0 (CNSA 2.0,
// announced 2022, advisory updated 2024) names a small, exact set of
// parameter choices that are *required* for U.S. National Security Systems,
// and explicitly *excludes* the others NIST standardized. This module turns
// those facts into a per-algorithm verdict so the page can surface a CNSA 2.0
// lens / badge / filter WITHOUT inventing any algorithm facts: every verdict
// below is keyed off the algorithm's name (its standardized parameter set),
// the same identifier already present in the reference CSV.
//
// Sources (also linked from the panel UI):
//  - NSA CNSA 2.0 advisory (CNSA_2.0_Algorithms_.pdf)
//  - FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), SP 800-208 (LMS/XMSS)
//
// CNSA 2.0 algorithm selections:
//  - ML-KEM-1024 ......... REQUIRED (asymmetric key establishment)
//  - ML-DSA-87 ........... REQUIRED (general-purpose digital signatures)
//  - LMS / XMSS (SP 800-208, SHA-256/192) .. APPROVED for software/firmware signing only
//  - AES-256 ............. REQUIRED (symmetric)
//  - SHA-384 / SHA-512 ... REQUIRED (hashing)
//  - SLH-DSA ............. NOT selected by CNSA 2.0 (stateless hash-based; excluded)
//  - lower ML-KEM/ML-DSA parameter sets (512/768, 44/65) .. below the CNSA 2.0 floor
//
// Anything not on the list (FrodoKEM, HQC, BIKE, Classic McEliece, FN-DSA,
// candidates, classical, composites) is simply "not part of CNSA 2.0".

import type { AlgorithmDetail } from '../../data/pqcAlgorithmsData'

export type Cnsa20Status =
  /** Named as a required CNSA 2.0 selection (ML-KEM-1024, ML-DSA-87, AES-256, SHA-384/512). */
  | 'required'
  /** Approved by CNSA 2.0 for a constrained role only — stateful hash-based sigs for SW/FW signing. */
  | 'approved-limited'
  /** A standardized member of a CNSA family, but below the CNSA 2.0 parameter floor. */
  | 'below-floor'
  /** Standardized by NIST but explicitly NOT selected by CNSA 2.0 (e.g. SLH-DSA). */
  | 'excluded'
  /** Not part of CNSA 2.0 (other PQC families, candidates, classical, composites). */
  | 'not-in-suite'

export interface Cnsa20Verdict {
  status: Cnsa20Status
  /** Short label for the badge / chip. */
  label: string
  /** One-line, data-grounded rationale for the tooltip. */
  rationale: string
}

/** Normalize an algorithm name for matching (strip parenthetical params, trim). */
function bareName(name: string): string {
  return name.split(/\s*\(/)[0].trim()
}

/**
 * Classify an algorithm against the CNSA 2.0 suite. Pure function of the
 * algorithm's standardized name — no invented facts.
 */
export function classifyCnsa20(algo: Pick<AlgorithmDetail, 'name' | 'family'>): Cnsa20Verdict {
  const name = bareName(algo.name)

  // --- Required selections ---
  if (name === 'ML-KEM-1024') {
    return {
      status: 'required',
      label: 'CNSA 2.0 required',
      rationale:
        'ML-KEM-1024 (FIPS 203, Level 5) is the CNSA 2.0 selection for asymmetric key establishment in U.S. National Security Systems.',
    }
  }
  if (name === 'ML-DSA-87') {
    return {
      status: 'required',
      label: 'CNSA 2.0 required',
      rationale:
        'ML-DSA-87 (FIPS 204, Level 5) is the CNSA 2.0 selection for general-purpose digital signatures in U.S. National Security Systems.',
    }
  }
  if (name === 'AES-256') {
    return {
      status: 'required',
      label: 'CNSA 2.0 required',
      rationale: 'AES-256 is the CNSA 2.0 symmetric-encryption selection.',
    }
  }
  if (name === 'SHA-384' || name === 'SHA-512') {
    return {
      status: 'required',
      label: 'CNSA 2.0 required',
      rationale: `${name} is a CNSA 2.0 selection for hashing.`,
    }
  }

  // --- Approved for a limited role: stateful hash-based signatures ---
  if (name.startsWith('LMS') || name.startsWith('XMSS') || name.startsWith('HSS')) {
    return {
      status: 'approved-limited',
      label: 'CNSA 2.0 (firmware only)',
      rationale:
        'Stateful hash-based signatures (LMS/XMSS, SP 800-208) are CNSA 2.0-approved only for software/firmware signing, not general use. State management is mandatory.',
    }
  }

  // --- Below the CNSA 2.0 parameter floor (right family, wrong level) ---
  if (name === 'ML-KEM-512' || name === 'ML-KEM-768') {
    return {
      status: 'below-floor',
      label: 'Below CNSA 2.0',
      rationale: `${name} is FIPS 203-standardized but below the CNSA 2.0 floor — CNSA 2.0 requires ML-KEM-1024 for National Security Systems.`,
    }
  }
  if (name === 'ML-DSA-44' || name === 'ML-DSA-65') {
    return {
      status: 'below-floor',
      label: 'Below CNSA 2.0',
      rationale: `${name} is FIPS 204-standardized but below the CNSA 2.0 floor — CNSA 2.0 requires ML-DSA-87 for National Security Systems.`,
    }
  }

  // --- Explicitly NOT selected by CNSA 2.0 ---
  if (name.startsWith('SLH-DSA')) {
    return {
      status: 'excluded',
      label: 'Not in CNSA 2.0',
      rationale:
        'SLH-DSA (FIPS 205) is NIST-standardized but was NOT selected by CNSA 2.0; CNSA 2.0 names ML-DSA-87 for general signatures and stateful LMS/XMSS for firmware.',
    }
  }

  return {
    status: 'not-in-suite',
    label: 'Not in CNSA 2.0',
    rationale: 'Not part of the CNSA 2.0 suite for U.S. National Security Systems.',
  }
}

/** True when the algorithm is a CNSA 2.0 required selection. */
export function isCnsa20Required(algo: Pick<AlgorithmDetail, 'name' | 'family'>): boolean {
  return classifyCnsa20(algo).status === 'required'
}

/**
 * True when the row should be kept under the "CNSA 2.0" filter lens — the
 * required selections plus the firmware-only approved stateful hash sigs.
 * (Below-floor / excluded / not-in-suite are filtered out.)
 */
export function passesCnsa20Filter(algo: Pick<AlgorithmDetail, 'name' | 'family'>): boolean {
  const s = classifyCnsa20(algo).status
  return s === 'required' || s === 'approved-limited'
}

/** Tailwind classes for a CNSA 2.0 status chip. Reuses status-* tokens. */
export function cnsa20ChipClasses(status: Cnsa20Status): string {
  switch (status) {
    case 'required':
      return 'bg-status-success/15 text-status-success border-status-success/30'
    case 'approved-limited':
      return 'bg-status-info/15 text-status-info border-status-info/30'
    case 'below-floor':
      return 'bg-status-warning/15 text-status-warning border-status-warning/30'
    case 'excluded':
      return 'bg-destructive/10 text-destructive border-destructive/30'
    default:
      return 'bg-muted/50 text-muted-foreground border-border'
  }
}

// ---------------------------------------------------------------------------
// Standards-pipeline / CNSA 2.0 transition timeline (gap-closer #2).
// Dates are the published CNSA 2.0 transition milestones; "don't deploy
// pre-standard" is the framework's own guidance, surfaced as a callout.
// ---------------------------------------------------------------------------

export interface Cnsa20Milestone {
  year: string
  title: string
  detail: string
}

export const CNSA20_TIMELINE: Cnsa20Milestone[] = [
  {
    year: '2024',
    title: 'Standards published',
    detail:
      'NIST finalizes FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA). CNSA 2.0 selections — ML-KEM-1024 and ML-DSA-87 — are now standardized and deployable.',
  },
  {
    year: '2025–2026',
    title: 'Begin transition',
    detail:
      'Software/firmware signing should already prefer CNSA 2.0 (LMS/XMSS now; ML-DSA-87 as products ship). New equipment acquisition starts requiring PQC support.',
  },
  {
    year: '2027',
    title: 'Software/firmware signing',
    detail:
      'CNSA 2.0 expects software- and firmware-signing solutions to support and prefer the CNSA 2.0 algorithms.',
  },
  {
    year: '2030',
    title: 'Networking & most equipment',
    detail:
      'CNSA 2.0 expects networking equipment (and most other classes) to use the CNSA 2.0 algorithms by default.',
  },
  {
    year: '2031–2033',
    title: 'Browsers, servers, cloud, OS',
    detail:
      'Web browsers/servers, cloud services and operating systems transition to CNSA 2.0 as a default.',
  },
  {
    year: '2035',
    title: 'Exclusive use',
    detail:
      'CNSA 2.0 algorithms are the exclusive requirement across National Security Systems; classical RSA/ECC disallowed.',
  },
]

export const CNSA20_DONT_DEPLOY_PRE_STANDARD =
  "Don't deploy pre-standard: only the finalized parameter sets (ML-KEM-1024, ML-DSA-87) count toward CNSA 2.0. Candidates and draft composites are not yet CNSA 2.0-eligible — use them for piloting, not production NSS."

export const CNSA20_ADVISORY_URL =
  'https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF'

// ---------------------------------------------------------------------------
// Hybrid / composite guidance (gap-closer #3) and jurisdictional mandate
// status (gap-closer #4). These are framework-level positions, surfaced as
// text — the per-row jurisdiction tag is derived from the transition's own
// Region field, not invented here.
// ---------------------------------------------------------------------------

export const HYBRID_COMPOSITE_GUIDANCE = {
  whenComposite:
    'Prefer a composite (PQC + classical, e.g. X25519+ML-KEM-768 or RSA-PSS+ML-DSA) when you need defense-in-depth during the transition, when a regulator mandates hybrid, or when the PQC implementation is not yet validated. The classical half guards against an undiscovered flaw in the new scheme.',
  whenPure:
    'Prefer pure ML-KEM / ML-DSA once the implementation is validated and your jurisdiction permits non-hybrid — it is simpler, faster, and is what CNSA 2.0 mandates (CNSA 2.0 requires the pure ML-KEM-1024 / ML-DSA-87, not a hybrid).',
} as const

export type JurisdictionStance = 'require' | 'prefer-pure' | 'interim' | 'permit'

export interface JurisdictionPosition {
  body: string
  stance: JurisdictionStance
  note: string
}

/**
 * Per-jurisdiction stance on hybrid/composite deployment, keyed off the
 * transition row's Region field. Returns null for regions with no recorded
 * mandate so the UI shows nothing (additive — no false labels).
 */
export function jurisdictionStanceForRegion(region: string): JurisdictionPosition | null {
  switch (region) {
    case 'BSI/ANSSI':
      return {
        body: 'BSI / ANSSI',
        stance: 'require',
        note: 'German BSI (TR-02102) and French ANSSI require hybrid (PQC + classical) during the transition — pure PQC alone is not yet accepted.',
      }
    case 'NIST':
      return {
        body: 'NSA / CNSA 2.0',
        stance: 'prefer-pure',
        note: 'CNSA 2.0 mandates pure ML-KEM-1024 / ML-DSA-87 for NSS; hybrids are permitted as an interim but not required.',
      }
    case 'IETF':
      return {
        body: 'IETF',
        stance: 'interim',
        note: 'IETF specifies hybrid/composite constructions (e.g. X25519MLKEM768) as transition mechanisms; standardization is in progress.',
      }
    case 'ETSI':
      return {
        body: 'ETSI',
        stance: 'permit',
        note: 'ETSI publishes hybrid and access-control KEM profiles (e.g. TS 104 015 Covercrypt).',
      }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Module-validation qualifier (gap-closer #5). The reference CSV's
// fips_standard tells you the *algorithm* is standardized (FIPS 203/204/205);
// it does NOT tell you a *module* implementing it is FIPS 140-3 validated.
// This helper makes that distinction explicit from the existing fields.
// ---------------------------------------------------------------------------

export interface ModuleValidationNote {
  /** The standard the algorithm itself is published under. */
  algorithmStandard: string
  /** Whether a FIPS 140-3 validated *module* is implied (it is not, by data). */
  moduleValidated: false
  caveat: string
}

/**
 * The fips_standard field certifies the algorithm spec, never a 140-3 module.
 * Always returns the caveat for FIPS-standardized rows so the page never
 * overstates "FIPS validated".
 */
export function moduleValidationNote(
  algo: Pick<AlgorithmDetail, 'fipsStandard'>
): ModuleValidationNote | null {
  const fs = algo.fipsStandard || ''
  if (!/FIPS\s*20[345]|SP\s*800-208/i.test(fs)) return null
  return {
    algorithmStandard: fs,
    moduleValidated: false,
    caveat: `${fs} standardizes the algorithm, not the implementation. For deployment in a regulated environment you still need a FIPS 140-3 validated cryptographic module (CMVP certificate) that implements it — check the CMVP validated-module list, not just the algorithm standard.`,
  }
}
