// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Hub's list of retired lessons and sections (`src/data/retiredSteps.json`): a tag the Hub no longer
 * holds, where a learner's step goes, why, and when. Read by the journey to name a retired step and offer
 * its replacement. Nothing here changes a learner's path; a swap is the learner's own action.
 */
import file from '@/data/retiredSteps.json'

export type RetiredRelation = 'replaced-by' | 'parent'

export interface RetiredEntry {
  /** The lesson (`LM-032`) or section (`LM-019/s:homomorphic-encryption`) the Hub no longer holds. */
  tag: string
  /** What it was called, where the Hub states that. */
  name?: string
  /** The tag that took its place, or the nearest tag that still exists. */
  to: string
  relation: RetiredRelation
  reason: string
  /** ISO date of the change. */
  date: string
}

export const RETIRED_STEPS: readonly RetiredEntry[] = file.entries as RetiredEntry[]

const BY_TAG: ReadonlyMap<string, RetiredEntry> = new Map(RETIRED_STEPS.map((e) => [e.tag, e]))

/** The entry for a retired tag, if the Hub lists one. */
export function retiredEntry(tag: string): RetiredEntry | undefined {
  return BY_TAG.get(tag)
}

/** What a retired lesson or section is called to the learner: its recorded name, never its internal tag. */
export const RETIRED_NAME_FALLBACK = 'A retired lesson'
export function retiredName(entry: RetiredEntry): string {
  return entry.name ?? RETIRED_NAME_FALLBACK
}
