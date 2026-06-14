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
    note: 'Hybrid (classical + PQC) is required; hybrid is also the accepted end state.',
  },
  FR: {
    authority: 'ANSSI',
    hybrid: 'required',
    endState: 'hybrid',
    note: 'Hybrid is required through the transition; hybrid is the accepted end state.',
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
    note: 'ASD discourages hybrid; move straight to pure PQC.',
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
