// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link helpers for /library?ref= (desktop and phone).
 *
 * - resolveLibraryDeepLink: live ref → item; retired ref with a `superseded_by`
 *   chain → its successor (flagged so the page can say so); otherwise null, so
 *   the page shows a "not found" notice instead of opening nothing.
 * - libraryWideningFor: which URL filters (and whether persona role narrowing)
 *   hide a linked item, so the page can widen just those and nothing else.
 */
import { findLibraryItemByRef, findLibrarySuccessor, type LibraryItem } from '@/data/libraryData'
import { PERSONA_LIBRARY_CATEGORIES } from '@/data/personaConfig'
import {
  matchesLibraryFilters,
  type LibraryFilterState,
  type LibraryPipelineInput,
} from './useLibraryPipeline'

export interface LibraryDeepLinkResolution {
  item: LibraryItem
  /** Set when the linked ref is retired and `item` is the document that superseded it. */
  supersededRef?: string
}

export function resolveLibraryDeepLink(ref: string): LibraryDeepLinkResolution | null {
  const item = findLibraryItemByRef(ref)
  if (item) return { item }
  const successor = findLibrarySuccessor(ref)
  return successor ? { item: successor, supersededRef: ref } : null
}

export interface LibraryWidening {
  /** URL params to delete (each one, on its own, hides the item). */
  drop: string[]
  /** Persona role narrowing hides the item — set `prefs=off`. */
  prefsOff: boolean
}

type WideningInput = Pick<
  LibraryPipelineInput,
  'activePurpose' | 'activeCategory' | 'selectedPersona' | 'prefsOff'
> &
  LibraryFilterState & {
    /** `qv=new` is applied outside the pipeline (status New/Updated). */
    newOnly: boolean
  }

/**
 * The minimal widening that makes `item` appear in the list, or null when it is
 * already visible. Each filter is tested in isolation against the item, so only
 * the filters that actually exclude it are dropped — the reader keeps the rest.
 */
export function libraryWideningFor(
  item: LibraryItem,
  input: WideningInput
): LibraryWidening | null {
  const neutral: LibraryFilterState = {
    activeOrg: 'All',
    filterText: '',
    geoFilter: [],
    sectorFilter: [],
    tierFilter: [],
    algoFamilyFilter: [],
    showOnlyLibraryBookmarks: false,
    libraryBookmarks: input.libraryBookmarks,
    cswp39Only: false,
    certRelevantOnly: false,
    certRelevantIdSet: input.certRelevantIdSet,
    lifecycleBucket: 'All',
    semanticIdSet: null,
  }
  const checks: [string, Partial<LibraryFilterState>][] = [
    ['org', { activeOrg: input.activeOrg }],
    ['geo', { geoFilter: input.geoFilter }],
    ['sector', { sectorFilter: input.sectorFilter }],
    ['tier', { tierFilter: input.tierFilter }],
    ['algo', { algoFamilyFilter: input.algoFamilyFilter }],
    [
      'qv',
      {
        showOnlyLibraryBookmarks: input.showOnlyLibraryBookmarks,
        certRelevantOnly: input.certRelevantOnly,
      },
    ],
    ['cswp39', { cswp39Only: input.cswp39Only }],
    ['lifecycle', { lifecycleBucket: input.lifecycleBucket }],
    ['q', { filterText: input.filterText, semanticIdSet: input.semanticIdSet }],
  ]
  const drop = checks
    .filter(([, only]) => !matchesLibraryFilters(item, { ...neutral, ...only }))
    .map(([key]) => key)
  if (input.newOnly && item.status !== 'New' && item.status !== 'Updated' && !drop.includes('qv'))
    drop.push('qv')
  if (input.activePurpose !== 'all' && item.purpose !== input.activePurpose) drop.push('purpose')
  if (input.activeCategory !== 'All' && !item.categories.includes(input.activeCategory))
    drop.push('cat')

  // Role narrowing only applies with no category and no search (same rule as
  // the pipeline), so judge it against the filters as they will be AFTER the drop.
  const preferred =
    input.prefsOff || !input.selectedPersona
      ? []
      : (PERSONA_LIBRARY_CATEGORIES[input.selectedPersona] ?? [])
  const categoryAfter = drop.includes('cat') ? 'All' : input.activeCategory
  const searchAfter = drop.includes('q') ? '' : input.filterText
  const prefsOff =
    preferred.length > 0 &&
    categoryAfter === 'All' &&
    !searchAfter &&
    !item.categories?.some((c) => preferred.includes(c))

  return drop.length > 0 || prefsOff ? { drop, prefsOff } : null
}
