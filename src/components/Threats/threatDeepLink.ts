// SPDX-License-Identifier: GPL-3.0-only
/**
 * `?id=` deep-link helpers shared by the desktop dashboard and the mobile
 * screen (deep-link remediation PR 1, 2026-09-28).
 *
 * A linked threat can be hidden by the page's own scoping — an explicit or
 * store-derived industry pick, the persona-default industry scope, a saved
 * "show only my threats" toggle, or the criticality/class/search/tier filters
 * a link carried. The dialog opens over the list either way, so the row behind
 * it was silently missing. These helpers say WHICH filters exclude the threat,
 * so the page can widen exactly those (and offer Undo).
 */
import type { ThreatItem } from '@/data/threatsData'
import { threatMatchesClass, type ThreatClass } from './threatClassification'
import { matchesThreatQuery } from './threatsUrlParams'

export type ThreatExclusion =
  'industry' | 'persona-scope' | 'criticality' | 'class' | 'q' | 'mine' | 'tier' | 'lens'

export interface ThreatScope {
  /** Explicit industries in effect (URL or picked); empty = none picked. */
  industries: readonly string[]
  /** The persona-default scope in effect (empty when inactive). */
  personaScope: readonly string[]
  criticality: string | null
  threatClass: string | null
  query: string
  /** "Show only my threats" is on and this is the bookmark list. */
  onlyMine?: readonly string[] | null
  /** Caller-evaluated filters that need page state (trust tier, protocol lens). */
  tierExcludes?: boolean
  lensExcludes?: boolean
}

/** Which active filters hide `threat`. Mirrors the dashboard's filter order. */
export function threatExclusions(threat: ThreatItem, scope: ThreatScope): ThreatExclusion[] {
  const out: ThreatExclusion[] = []
  if (scope.industries.length > 0) {
    if (!scope.industries.includes(threat.industry)) out.push('industry')
  } else if (scope.personaScope.length > 0 && !scope.personaScope.includes(threat.industry)) {
    out.push('persona-scope')
  }
  if (scope.lensExcludes) out.push('lens')
  if (scope.criticality && scope.criticality !== 'All' && threat.criticality !== scope.criticality)
    out.push('criticality')
  if (
    scope.threatClass &&
    scope.threatClass !== 'All' &&
    !threatMatchesClass(threat, scope.threatClass as ThreatClass)
  )
    out.push('class')
  if (scope.query.trim() && !matchesThreatQuery(threat, scope.query)) out.push('q')
  if (scope.onlyMine && !scope.onlyMine.includes(threat.threatId)) out.push('mine')
  if (scope.tierExcludes) out.push('tier')
  return out
}

const EXCLUSION_LABELS: Record<ThreatExclusion, string> = {
  industry: 'added its industry',
  'persona-scope': 'added its industry to your role’s default scope',
  criticality: 'cleared the criticality filter',
  class: 'cleared the threat-class filter',
  q: 'cleared the search',
  mine: 'turned off “My threats only”',
  tier: 'cleared the trust-tier filter',
  lens: 'cleared the protocol lens',
}

/** "Filters widened to show FIN-001: added its industry, cleared the search." */
export function threatWidenedMessage(threatId: string, exclusions: ThreatExclusion[]): string {
  // eslint-disable-next-line security/detect-object-injection -- closed union
  return `Filters widened to show ${threatId}: ${exclusions.map((e) => EXCLUSION_LABELS[e]).join(', ')}.`
}

/** Notice for an `?id=` that is neither published nor retired. */
export function threatNotFoundMessage(
  threatId: string,
  draftIndustries: ReadonlyMap<string, string>
): string {
  return draftIndustries.has(threatId)
    ? `Threat ${threatId} isn't published yet — it is awaiting a source document that states the quantum risk.`
    : `Threat "${threatId}" was not found. The link may be mistyped, or the entry was renamed.`
}
