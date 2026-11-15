// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A threat's related standards as Library entries. The CSV's
 * `related_standards` holds ';'-joined Library reference ids; an id the
 * Library does not hold is left out rather than shown raw (the same rule the
 * "Learn More" module links follow), so a reader never gets a dead link.
 */
import { findStandard, type StandardRef } from './standardsRegistry'
import type { ThreatItem } from './threatsData'

export function threatStandardLinks(threat: Pick<ThreatItem, 'relatedStandards'>): StandardRef[] {
  const seen = new Set<string>()
  const out: StandardRef[] = []
  for (const id of threat.relatedStandards ?? []) {
    const std = findStandard(id)
    if (!std || seen.has(std.id)) continue
    seen.add(std.id)
    out.push(std)
  }
  return out
}
