// SPDX-License-Identifier: GPL-3.0-only
/**
 * Maturity self-rating L0–L4 — gap-closer #6 (spec §6.6, Assess #7;
 * framework "Maturity" p.69). Foundations phase.
 *
 * A per-domain L0–L4 capability ladder the user self-rates, plus an aggregate
 * maturity score (0–100) that the QRA exec-summary expects. Pure data + pure
 * functions — no React, no store. The UI component
 * (`components/Assess/MaturitySelfRating.tsx`) owns the per-domain `level` state
 * and feeds it here; the QRA builder consumes the aggregate.
 *
 * Additive: when no levels are supplied the engine output is unchanged; the QRA
 * simply omits the maturity block.
 */

/** The five capability domains rated independently on the L0–L4 ladder. */
export type MaturityDomainId =
  | 'governance'
  | 'inventory'
  | 'crypto-agility'
  | 'risk-management'
  | 'skills'

/** L0 (none) … L4 (optimised). `null` = not yet rated. */
export type MaturityLevel = 0 | 1 | 2 | 3 | 4

export interface MaturityDomain {
  id: MaturityDomainId
  label: string
  /** What this domain measures, one line. */
  description: string
  /** Verbatim ladder rung descriptions, indexed by level 0–4. */
  ladder: [string, string, string, string, string]
}

/** One domain's self-rating. `level === null` until the user picks a rung. */
export interface MaturityDomainRating {
  domain: MaturityDomainId
  level: MaturityLevel | null
}

/** The aggregate result fed into the QRA. */
export interface MaturityAssessment {
  ratings: MaturityDomainRating[]
  /** Mean of rated domains, on the 0–4 ladder (rounded to 1 dp). */
  averageLevel: number
  /** averageLevel rescaled to 0–100 for the QRA exec-summary score. */
  score: number
  /** Coarse band derived from averageLevel for display. */
  band: 'nascent' | 'developing' | 'defined' | 'managed' | 'optimised'
  /** How many of the five domains have been rated. */
  ratedCount: number
  /** true once every domain has a level (complete self-rating). */
  isComplete: boolean
}

/** The canonical five-domain L0–L4 ladder (framework Maturity model, p.69). */
export const MATURITY_DOMAINS: Record<MaturityDomainId, MaturityDomain> = {
  governance: {
    id: 'governance',
    label: 'Governance & Mandate',
    description: 'Executive sponsorship, budget, and program ownership for PQC migration.',
    ladder: [
      'L0 — No awareness or ownership of quantum risk.',
      'L1 — Ad-hoc awareness; no mandate or budget.',
      'L2 — Sponsor identified; initial budget and charter drafted.',
      'L3 — Funded program with a named QRPM and steering cadence.',
      'L4 — Quantum readiness embedded in enterprise risk governance and reviewed continuously.',
    ],
  },
  inventory: {
    id: 'inventory',
    label: 'Cryptographic Inventory',
    description: 'Knowledge of where and how cryptography is used across the estate.',
    ladder: [
      'L0 — No cryptographic inventory exists.',
      'L1 — Partial, manual list of known crypto usage.',
      'L2 — Inventory covering Tier-1 systems underway.',
      'L3 — Broad inventory with a machine-readable CBOM for most systems.',
      'L4 — Continuously-maintained, queryable CBOM across the full estate.',
    ],
  },
  'crypto-agility': {
    id: 'crypto-agility',
    label: 'Crypto-Agility',
    description: 'Ability to swap cryptographic algorithms without re-architecting.',
    ladder: [
      'L0 — Cryptography hardcoded throughout; swaps require rewrites.',
      'L1 — Some abstraction in newer systems only.',
      'L2 — Crypto abstraction layers adopted for key systems.',
      'L3 — Most systems use a central crypto provider with config-driven algorithms.',
      'L4 — Estate-wide crypto-agility; algorithm changes are configuration, not code.',
    ],
  },
  'risk-management': {
    id: 'risk-management',
    label: 'Risk Management',
    description: 'HNDL/HNFL exposure scoring and a prioritised migration backlog.',
    ladder: [
      'L0 — Quantum risk not assessed.',
      'L1 — Qualitative awareness of HNDL/HNFL exposure.',
      'L2 — Initial risk scoring of priority systems.',
      'L3 — Prioritised, owned migration backlog (a QRA) maintained.',
      'L4 — Risk continuously re-scored against an evolving CRQC timeline.',
    ],
  },
  skills: {
    id: 'skills',
    label: 'Skills & Team',
    description: 'PQC competence, staffing, and a build/borrow/buy plan.',
    ladder: [
      'L0 — No PQC skills in-house.',
      'L1 — Isolated individual interest; no plan.',
      'L2 — Core roles identified; training begun.',
      'L3 — Staffed program with a build/borrow/buy plan and sizing model.',
      'L4 — Mature crypto-champion program and sustained competence pipeline.',
    ],
  },
}

/** Domain display order (Governance → Skills, mirroring the program lifecycle). */
export const MATURITY_DOMAIN_ORDER: MaturityDomainId[] = [
  'governance',
  'inventory',
  'crypto-agility',
  'risk-management',
  'skills',
]

/** An all-unrated starting set (one entry per domain), for the UI's initial state. */
export function emptyMaturityRatings(): MaturityDomainRating[] {
  return MATURITY_DOMAIN_ORDER.map((domain) => ({ domain, level: null }))
}

function bandFor(avg: number): MaturityAssessment['band'] {
  if (avg < 0.5) return 'nascent'
  if (avg < 1.5) return 'developing'
  if (avg < 2.5) return 'defined'
  if (avg < 3.5) return 'managed'
  return 'optimised'
}

/**
 * Aggregate per-domain L0–L4 ratings into a 0–100 maturity score for the QRA.
 *
 * Only *rated* domains (level !== null) count toward the average — an
 * incomplete self-rating still yields a meaningful partial score. When nothing
 * is rated, `score` is 0, `averageLevel` is 0, and `isComplete` is false; the
 * QRA builder treats that as "no maturity data" and omits the block.
 */
export function aggregateMaturity(ratings: MaturityDomainRating[]): MaturityAssessment {
  const rated = ratings.filter((r) => r.level !== null) as Array<{
    domain: MaturityDomainId
    level: MaturityLevel
  }>
  const ratedCount = rated.length
  const averageLevel =
    ratedCount === 0
      ? 0
      : Math.round((rated.reduce((sum, r) => sum + r.level, 0) / ratedCount) * 10) / 10
  const score = Math.round((averageLevel / 4) * 100)
  return {
    ratings,
    averageLevel,
    score,
    band: bandFor(averageLevel),
    ratedCount,
    isComplete: ratedCount === MATURITY_DOMAIN_ORDER.length,
  }
}
