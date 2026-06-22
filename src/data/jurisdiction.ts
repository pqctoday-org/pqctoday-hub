// SPDX-License-Identifier: GPL-3.0-only
/**
 * jurisdiction — per-country PQC migration rules for the Simulation (App. D of
 * the framework). The country dial drives not just the deadline (the Mosca
 * clock) but the *compliant migration choice*: mandate countries require hybrid
 * (classical + PQC) now; others treat hybrid as interim toward a pure end state.
 */
export type MigChoice = 'classical' | 'hybrid' | 'pure'
export type HybridStance = 'required' | 'interim' | 'discouraged'
export type EndState = 'hybrid' | 'pure'

export interface JurisdictionRule {
  authority: string
  hybrid: HybridStance
  endState: EndState
  /** Plain-language summary for the panel. */
  note: string
}

export const JURISDICTION_RULES: Record<string, JurisdictionRule> = {
  US: {
    authority: 'CNSA 2.0 (NSA)',
    hybrid: 'interim',
    endState: 'pure',
    note: 'Hybrid is an accepted interim step; the end state is pure PQC.',
  },
  DE: {
    authority: 'BSI',
    hybrid: 'required',
    endState: 'hybrid',
    note: 'Hybrid (classical + PQC) is required through the transition; BSI accepts hybrid as a long-term posture, not only an interim step.',
  },
  FR: {
    authority: 'ANSSI',
    hybrid: 'required',
    endState: 'hybrid',
    note: 'Hybrid is required through the transition; ANSSI accepts hybrid as a long-term posture, not only an interim step.',
  },
  UK: {
    authority: 'NCSC',
    hybrid: 'interim',
    endState: 'pure',
    note: 'Hybrid is acceptable as an interim; NCSC prefers a pure-PQC end state.',
  },
  AU: {
    authority: 'ASD',
    hybrid: 'discouraged',
    endState: 'pure',
    note: 'ASD does not mandate hybrid and permits adopting final PQC standards directly; it emphasises hybrid less than BSI/ANSSI. (Stance modelled as "lean pure" — recommends a pure end state.)',
  },
  // PR-5 — broadened jurisdictions. Stances confirmed against 2025–2026 published
  // guidance; deadlines are illustrative planning horizons (provenance 'planning'
  // in moscaClock.COUNTRY_DEADLINE_PROVENANCE).
  EU: {
    authority: 'ENISA / EU Commission',
    hybrid: 'required',
    endState: 'pure',
    note: 'ENISA recommends PQ/T hybrid schemes through the transition; the NIS Cooperation Group roadmap (2025) targets high-risk systems by 2030 and full PQC by 2035 — a pure-only pilot now is premature.',
  },
  CA: {
    authority: 'CCCS',
    hybrid: 'interim',
    endState: 'pure',
    note: 'CCCS roadmap ITSM.40.001 allows hybrid/backward-compatible operation as a transitional stage; high-priority systems by 2031, full migration to pure PQC by 2035.',
  },
  JP: {
    authority: 'CRYPTREC',
    hybrid: 'discouraged',
    endState: 'pure',
    note: 'CRYPTREC is adding ML-KEM/ML-DSA (FIPS 203/204) to its Ciphers List for direct procurement rather than mandating hybrid; a national roadmap is expected ~2027, full transition ~2035.',
  },
  KR: {
    authority: 'KISA / NIS',
    hybrid: 'interim',
    endState: 'pure',
    note: "Korea's national PQC master plan (NIS/MSIT) targets a full transition of national crypto — incl. the KpqC national algorithms — to pure PQC by 2035; hybrid is an interim step.",
  },
  SG: {
    authority: 'CSA',
    hybrid: 'interim',
    endState: 'pure',
    note: "CSA's Quantum-Safe Handbook treats hybrid as an optional transitional / defence-in-depth choice toward a pure end state; no fixed national deadline (2035 is an illustrative horizon).",
  },
}

export function jurisdictionFor(country: string): JurisdictionRule | undefined {
  return JURISDICTION_RULES[country]
}

/** The migration choice this jurisdiction steers you toward. */
export function recommendedChoice(rule: JurisdictionRule): string {
  if (rule.hybrid === 'required') return 'hybrid'
  if (rule.hybrid === 'discouraged') return 'pure'
  return 'hybrid now → pure later' // interim
}

export interface ComplianceVerdict {
  ok: boolean
  level: 'ok' | 'warn' | 'fail'
  reason: string
}

/** Is a migration choice compliant in this jurisdiction? (App. D validation) */
export function checkChoice(country: string, choice: MigChoice): ComplianceVerdict {
  const rule = JURISDICTION_RULES[country]
  if (!rule) return { ok: true, level: 'ok', reason: 'No jurisdiction rule.' }
  if (choice === 'classical')
    return { ok: false, level: 'fail', reason: 'Classical-only is not PQC-compliant anywhere.' }
  if (rule.hybrid === 'required' && choice === 'pure')
    return {
      ok: false,
      level: 'fail',
      reason: `${rule.authority} requires hybrid — a pure choice is non-compliant.`,
    }
  if (rule.endState === 'pure' && choice === 'hybrid')
    return {
      ok: true,
      level: 'warn',
      reason: `${rule.authority} end state is pure — hybrid is fine as interim, plan a sunset.`,
    }
  return { ok: true, level: 'ok', reason: `Compliant with ${rule.authority}.` }
}
