// SPDX-License-Identifier: GPL-3.0-only
/**
 * maturityModel — the framework's overall Program Maturity self-assessment model.
 *
 * Source: Applied Quantum PQC Migration Framework v2.1 — Maturity Levels /
 * Assessment Across Seven Domains.
 *
 * This is the framework's DISTINCT overall-program model: a 0–5 maturity scale
 * scored independently across seven domains, where the overall program maturity
 * is the WEAKEST domain (a chain is only as strong as its weakest link).
 *
 * NOTE: This is intentionally separate from `phaseMaturity.ts`, which encodes
 * the per-phase 0–4 indicator ladder. Do not conflate the two.
 */
import type { PhaseId } from './frameworkPhases'

/** The six overall-maturity levels (0–5). Level 0 = nothing started. */
export interface MaturityLevel {
  level: number
  name: string
  description: string
}

export const MATURITY_LEVELS: MaturityLevel[] = [
  {
    level: 0,
    name: 'Unaware',
    description:
      'No organizational awareness of quantum cryptographic risk; no activities planned or underway',
  },
  {
    level: 1,
    name: 'Aware',
    description:
      'Quantum risk acknowledged at leadership level; initial education conducted; no formal program',
  },
  {
    level: 2,
    name: 'Initiated',
    description:
      'Formal program chartered; budget allocated; discovery underway; initial CBOM in development',
  },
  {
    level: 3,
    name: 'Progressing',
    description:
      'CBOM operational; risk scoring complete; hybrid pilots in production; vendor engagement active; KPIs reported',
  },
  {
    level: 4,
    name: 'Advanced',
    description:
      'Tier-1 systems migrated to hybrid/PQC; PKI modernized; crypto-agility demonstrated; vendor commitments secured',
  },
  {
    level: 5,
    name: 'Optimized',
    description:
      'Estate-wide PQC migration substantially complete; crypto-agility is organizational capability; continuous monitoring and posture management operational',
  },
]

/** The seven assessment domains. */
export type DomainId =
  | 'inventory'
  | 'governance'
  | 'pilots'
  | 'vendor'
  | 'compliance'
  | 'agility'
  | 'risk'

/**
 * Per-domain level descriptors. Level 0 is always "not started", so only the
 * scored levels 1–5 carry a descriptor here.
 */
export interface MaturityDomain {
  id: DomainId
  name: string
  levels: Record<1 | 2 | 3 | 4 | 5, string>
}

export const MATURITY_DOMAINS: MaturityDomain[] = [
  {
    id: 'inventory',
    name: 'Cryptographic Inventory',
    levels: {
      1: 'Awareness that inventory is needed',
      2: 'Partial inventory of known systems',
      3: '≥70% Tier-1 coverage; automated discovery deployed',
      4: '≥90% coverage; continuous monitoring; IT+OT+cloud',
      5: 'Real-time posture management; auto-alerting on drift',
    },
  },
  {
    id: 'governance',
    name: 'Governance & Ownership',
    levels: {
      1: 'Informal awareness',
      2: 'Charter exists; QRPM appointed',
      3: 'SteerCo operational; RACI defined; budget committed',
      4: 'Multi-year governance; integrated into risk register',
      5: 'Quantum readiness part of BAU enterprise governance',
    },
  },
  {
    id: 'pilots',
    name: 'Pilots & Deployment',
    levels: {
      1: 'No pilots',
      2: 'Lab testing only',
      3: '2+ production pilots with measured results',
      4: 'Tier-1 systems on hybrid/PQC; wave rollout underway',
      5: 'Estate-wide deployment; transitioning to PQC-only',
    },
  },
  {
    id: 'vendor',
    name: 'Vendor & Supply Chain',
    levels: {
      1: 'No vendor engagement',
      2: 'Ad-hoc inquiries',
      3: 'Top 10 vendors formally engaged; questionnaires sent',
      4: 'PQC in procurement; contracts include clauses; blockers managed',
      5: 'All strategic vendors PQC-committed; bridging patterns eliminated',
    },
  },
  {
    id: 'compliance',
    name: 'Compliance & Standards',
    levels: {
      1: 'Unaware of requirements',
      2: 'Regulatory requirements mapped',
      3: 'Compliance gaps identified; remediation planned',
      4: 'Meeting current deadlines; evidence documented',
      5: 'Proactive compliance; contributing to standards development',
    },
  },
  {
    id: 'agility',
    name: 'Crypto-Agility',
    levels: {
      1: 'Hardcoded algorithms throughout',
      2: 'Awareness of agility need',
      3: 'Abstraction layers in new development',
      4: 'Algorithm swap via config for Tier-1; automated cert lifecycle',
      5: 'Organization-wide agility; algorithm changes are routine operations',
    },
  },
  {
    id: 'risk',
    name: 'Risk & Prioritization',
    levels: {
      1: 'No quantum risk assessment',
      2: 'Basic awareness of HNDL/TNFL',
      3: 'Formal risk scoring; prioritized backlog',
      4: 'QRA updated quarterly; migration tracking against backlog',
      5: 'Continuous risk posture management; automated re-scoring',
    },
  },
]

/** A scored self-assessment: each domain rated 0–5. */
export type MaturityScores = Record<DomainId, number>

/** Target maturity trajectory the framework recommends. */
export interface MaturityTargetMilestone {
  milestone: string
  detail: string
}

export const MATURITY_TARGET_TIMELINE: MaturityTargetMilestone[] = [
  { milestone: 'End of Year 1', detail: 'Level 2 across all domains' },
  { milestone: 'End of Year 2', detail: 'Level 3 across all domains' },
  { milestone: 'End of Year 3', detail: 'Level 4 across at least 5 of 7 domains' },
  { milestone: 'End of Year 5', detail: 'Level 4 or 5 across all domains' },
]

/**
 * Overall program maturity = the MINIMUM domain score (weakest-link rule).
 * A chain is only as strong as its weakest link, so the program's overall
 * maturity is gated by its least-mature domain.
 */
export function overallMaturity(scores: MaturityScores): number {
  return Math.min(...MATURITY_DOMAINS.map((d) => scores[d.id]))
}

/**
 * Which sim lifecycle phase(s) each maturity domain primarily informs. Used to
 * project the self-assessed baseline onto the sim's phase ladder. Read-only: it
 * surfaces "where you self-assess today", it never grants earned sim levels.
 */
export const DOMAIN_TO_PHASES: Record<DomainId, PhaseId[]> = {
  inventory: ['p1', 'p2'],
  governance: ['p0', 'p4'],
  pilots: ['p5'],
  vendor: ['p7'],
  compliance: ['p3', 'foundations'],
  agility: ['p6', 'foundations'],
  risk: ['p3'],
}

/**
 * Project the seven-domain self-assessment onto a per-phase baseline in the sim's
 * 0–4 ladder range. A phase fed by several domains takes the WEAKEST of them
 * (same weakest-link rule); level 5 clamps to 4 (the per-phase ladder tops at 4).
 * This is a "self-assessed today" marker only — it does NOT grant sim maturity
 * (the sim's strict gating, earned in-game, is unchanged).
 */
export function phaseBaselineFromMaturity(
  scores: MaturityScores
): Partial<Record<PhaseId, number>> {
  const byPhase: Partial<Record<PhaseId, number[]>> = {}
  for (const d of MATURITY_DOMAINS) {
    for (const phase of DOMAIN_TO_PHASES[d.id]) {
      ;(byPhase[phase] ??= []).push(scores[d.id])
    }
  }
  const out: Partial<Record<PhaseId, number>> = {}
  for (const phase of Object.keys(byPhase) as PhaseId[]) {
    out[phase] = Math.min(4, Math.min(...byPhase[phase]!))
  }
  return out
}
