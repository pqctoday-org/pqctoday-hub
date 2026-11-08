// SPDX-License-Identifier: AGPL-3.0-only
//
// Plain words for the links in the concept cross-walk, in one place so the
// side panel, the phone sheet, the concept graph and its legend cannot drift.
//
// The two life-cycle links read from either end:
//
//   published_by   from the document: "Published by"      from the publisher: "Publishes"
//   supersedes     from the newer one: "Replaces an older edition"
//                  from the older one: "Replaced by a newer edition"
//
// Neither says that two things are the same, and neither says that one applies
// because the other does.

export type LifecycleLinkType = 'published_by' | 'supersedes'

export interface LifecycleLinkWords {
  /** Reading the link from the end it starts at (the arrow leaves this record). */
  fromSource: string
  /** Reading the link from the end the arrow points to. */
  fromTarget: string
}

export const LIFECYCLE_LINK_WORDS: Readonly<Record<LifecycleLinkType, LifecycleLinkWords>> = {
  published_by: { fromSource: 'Published by', fromTarget: 'Publishes' },
  supersedes: {
    fromSource: 'Replaces an older edition',
    fromTarget: 'Replaced by a newer edition',
  },
}

export function isLifecycleLinkType(type: string): type is LifecycleLinkType {
  return type === 'published_by' || type === 'supersedes'
}

/** Link types drawn with an arrowhead: the ones that only make sense in one direction. */
export const DIRECTIONAL_LINK_TYPES: ReadonlySet<string> = new Set([
  'subset_of',
  'superset_of',
  'scheme_under',
  'part_of_series',
  'published_by',
  'supersedes',
  'implements',
])

/** What each link type means, in a sentence a reader can use; shown in the graph legend. */
export const LINK_DEFINITIONS: Readonly<Record<string, string>> = {
  subset_of: 'The first record covers part of what the second covers.',
  superset_of: 'The first record covers everything the second covers, and more.',
  equivalent: 'The two records are recorded as covering the same ground.',
  intersects_with: 'The two records overlap; neither contains the other.',
  scheme_under: 'A national scheme that operates under the umbrella scheme the arrow points to.',
  part_of_series: 'A volume or companion of the main document the arrow points to.',
  published_by: 'The document comes from the organisation the arrow points to.',
  supersedes:
    'The newer edition replaces the older edition the arrow points to. A draft is never shown as replacing anything.',
  not_related: 'The source states the two records are unrelated.',
  implements:
    'Generated context, drawn dashed: the standard defines the algorithm set the arrow points to.',
}
