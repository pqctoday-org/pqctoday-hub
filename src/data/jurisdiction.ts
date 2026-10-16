// SPDX-License-Identifier: AGPL-3.0-only
/**
 * jurisdiction — per-country PQC migration rules for the Simulation.
 *
 * The types (HybridStance, EndState, JurisdictionRule) are defined here because
 * jurisdictionsData.ts imports them — keeping the dependency direction clean.
 * The JURISDICTION_RULES constant is now CSV-driven via jurisdictionsData so that
 * adding or updating a country rule only requires a CSV edit, not a code change.
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

// Import + re-export from the canonical CSV-driven source.
import { JURISDICTION_RULES } from '@/data/jurisdictionsData'
export { JURISDICTION_RULES }

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
  level: 'ok' | 'warn' | 'fail' | 'unknown'
  reason: string
  /** W4: false when no rule applies, so NOTHING was assessed. The absence of a
   *  rule is not a pass — it used to return `ok` and read as compliance. */
  evaluated: boolean
}

/**
 * Is a migration choice aligned with this jurisdiction's stated position?
 *
 * This is scenario strategy alignment, not a compliance determination: it
 * compares a choice against one country-level stance, with no view of sector,
 * system scope, or effective date. An unknown jurisdiction returns `unknown`
 * (not evaluated) rather than a pass.
 */
export function checkChoice(country: string, choice: MigChoice): ComplianceVerdict {
  const rule = JURISDICTION_RULES[country]
  if (!rule)
    return {
      ok: false,
      level: 'unknown',
      reason: 'No rule on file for this jurisdiction — not evaluated.',
      evaluated: false,
    }
  if (choice === 'classical')
    return {
      ok: false,
      level: 'fail',
      reason: 'Classical-only is not PQC-compliant anywhere.',
      evaluated: true,
    }
  if (rule.hybrid === 'required' && choice === 'pure')
    return {
      ok: false,
      level: 'fail',
      reason: `${rule.authority} requires hybrid — a pure choice is non-compliant.`,
      evaluated: true,
    }
  if (rule.endState === 'pure' && choice === 'hybrid')
    return {
      ok: true,
      level: 'warn',
      reason: `${rule.authority} end state is pure — hybrid is fine as interim, plan a sunset.`,
      evaluated: true,
    }
  return {
    ok: true,
    level: 'ok',
    reason: `Aligned with ${rule.authority}.`,
    evaluated: true,
  }
}
