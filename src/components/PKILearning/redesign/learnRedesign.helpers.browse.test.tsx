// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { BrowseAllView } from './BrowseAllView'
import {
  BROWSE_ALL,
  BROWSE_SORT_ITEMS,
  BROWSE_STATUS_ITEMS,
  filterAndSortModules,
  minutesOf,
  resolveBrowseTrack,
  type BrowseSortMode,
} from './learnRedesign.helpers'
import { MODULE_TRACKS, MODULE_CATALOG } from '../moduleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { MODULE_TOPIC_KEYWORDS } from '@/data/moduleTopicSummaries'

const all = MODULE_TRACKS.flatMap((t) => t.modules)
const ids = (n: number, from = 0) => all.slice(from, from + n).map((m) => m.id)

/** Some modules completed, some in progress, some saved: enough to make every filter bite. */
function seedProgress() {
  const modules: Record<string, { status: 'completed' | 'in-progress' }> = {}
  for (const id of ids(6, 0)) modules[id] = { status: 'completed' }
  for (const id of ids(9, 10)) modules[id] = { status: 'in-progress' }
  // The store merges real progress records; the list only reads `.status`.
  useModuleStore.setState({ modules: modules as never })
  useBookmarkStore.setState({ myLearnModules: [...ids(4, 3), ...ids(4, 40)] })
}

interface Scenario {
  name: string
  search?: string
  track?: string
  status?: string
  sort?: BrowseSortMode
  savedOnly?: boolean
}

const SCENARIOS: Scenario[] = [
  { name: 'no filters' },
  { name: 'search "HSM"', search: 'HSM' },
  { name: 'search with two words', search: 'key management' },
  { name: 'search that finds nothing', search: 'zzzznotaword' },
  { name: 'track Protocols', track: 'Protocols' },
  { name: 'saved only', savedOnly: true },
  { name: 'status in progress', status: 'in-progress' },
  { name: 'status completed', status: 'completed' },
  { name: 'status not started', status: 'not-started' },
  { name: 'sort A to Z', sort: 'alpha' },
  { name: 'sort by difficulty', sort: 'difficulty' },
  { name: 'sort shortest first', sort: 'duration' },
  { name: 'sort by status', sort: 'status' },
  {
    name: 'everything at once',
    search: 'pqc',
    track: 'Strategy',
    status: 'not-started',
    sort: 'alpha',
  },
]

/** The module titles the desktop list view shows, top to bottom (one flat column of rows). */
const readDesktopRows = () =>
  Array.from(document.querySelectorAll('.divide-y > button')).map(
    (row) => row.querySelector('span')?.textContent ?? ''
  )

/** Drive the desktop Browse all view into a scenario, then switch it to the flat list view. */
function driveDesktop(s: Scenario) {
  render(
    <MemoryRouter initialEntries={['/learn']}>
      <BrowseAllView personaId={null} />
    </MemoryRouter>
  )
  if (s.search)
    fireEvent.change(screen.getByLabelText('Search modules'), { target: { value: s.search } })
  if (s.track)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${s.track} · \\d+$`) }))
  if (s.savedOnly) fireEvent.click(screen.getByRole('button', { name: /^Saved \(\d+\)$/ }))
  if (s.status) {
    fireEvent.click(screen.getByRole('button', { name: /All statuses/ }))
    const label = BROWSE_STATUS_ITEMS.find((i) => i.id === s.status)!.label
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }))
  }
  if (s.sort) {
    fireEvent.click(screen.getByRole('button', { name: /Recommended/ }))
    const label = BROWSE_SORT_ITEMS.find((i) => i.id === s.sort)!.label
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }))
  }
  fireEvent.click(screen.getByRole('button', { name: 'List view' }))
}

describe('Browse all: the shared filter gives the same list the desktop catalogue shows', () => {
  beforeEach(() => {
    localStorage.clear()
    seedProgress()
  })

  it.each(SCENARIOS)('$name', async (s) => {
    driveDesktop(s)
    const expected = filterAndSortModules({
      tracks: MODULE_TRACKS,
      search: s.search,
      topicKeywords: s.search ? MODULE_TOPIC_KEYWORDS : null,
      track: s.track,
      status: s.status,
      sort: s.sort,
      savedOnly: s.savedOnly,
      savedIds: new Set(useBookmarkStore.getState().myLearnModules),
      progress: useModuleStore.getState().modules,
    })
      .flatMap((g) => g.modules)
      .map((m) => m.title)
    // The desktop view loads topic keywords on the first search, so wait for its list to settle.
    await waitFor(() => expect(readDesktopRows()).toEqual(expected))
  })

  it('the scenarios are not vacuous: filters really narrow the catalogue and sorts really reorder it', () => {
    const base = filterAndSortModules({ tracks: MODULE_TRACKS })
    expect(base.flatMap((g) => g.modules)).toHaveLength(all.length)
    const sizeOf = (s: Partial<Scenario>) =>
      filterAndSortModules({
        tracks: MODULE_TRACKS,
        ...s,
        savedIds: new Set(useBookmarkStore.getState().myLearnModules),
        progress: useModuleStore.getState().modules,
      }).flatMap((g) => g.modules).length
    expect(sizeOf({ status: 'completed' })).toBe(6)
    expect(sizeOf({ status: 'in-progress' })).toBe(9)
    expect(sizeOf({ savedOnly: true })).toBe(8)
    expect(sizeOf({ track: 'Protocols' })).toBeLessThan(all.length)
    const alpha = filterAndSortModules({ tracks: MODULE_TRACKS, sort: 'alpha' })
    expect(alpha.flatMap((g) => g.modules).map((m) => m.id)).not.toEqual(
      base.flatMap((g) => g.modules).map((m) => m.id)
    )
  })
})

describe('filterAndSortModules', () => {
  it('keeps every module exactly once with no filters', () => {
    const list = filterAndSortModules({ tracks: MODULE_TRACKS }).flatMap((g) => g.modules)
    expect(list.map((m) => m.id).sort()).toEqual(all.map((m) => m.id).sort())
  })

  it('drops tracks with no modules left', () => {
    const groups = filterAndSortModules({ tracks: MODULE_TRACKS, track: 'Protocols' })
    expect(groups.map((g) => g.track)).toEqual(['Protocols'])
  })

  it('sorts shortest first with an unparsable duration last', () => {
    expect(minutesOf('45 min')).toBe(45)
    expect(minutesOf('soon')).toBe(999)
    const tracks = [
      {
        track: 'T',
        modules: [
          { id: 'a', title: 'A', description: '', duration: '90 min' },
          { id: 'b', title: 'B', description: '', duration: 'varies' },
          { id: 'c', title: 'C', description: '', duration: '15 min' },
        ],
      },
    ]
    const order = filterAndSortModules({ tracks, sort: 'duration' })[0].modules.map((m) => m.id)
    expect(order).toEqual(['c', 'a', 'b'])
  })

  it('treats a module with no progress record as not started', () => {
    const list = filterAndSortModules({
      tracks: MODULE_TRACKS,
      status: 'not-started',
      progress: {},
    })
    expect(list.flatMap((g) => g.modules)).toHaveLength(all.length)
  })

  it('applies the extra desktop filter as well as the others', () => {
    const only = new Set(ids(3))
    const list = filterAndSortModules({ tracks: MODULE_TRACKS, extraFilter: (id) => only.has(id) })
    expect(
      list
        .flatMap((g) => g.modules)
        .map((m) => m.id)
        .sort()
    ).toEqual([...only].sort())
  })

  it('does not reorder or change the catalogue it was given', () => {
    const before = JSON.stringify(MODULE_TRACKS.map((t) => t.modules.map((m) => m.id)))
    filterAndSortModules({ tracks: MODULE_TRACKS, sort: 'alpha' })
    expect(JSON.stringify(MODULE_TRACKS.map((t) => t.modules.map((m) => m.id)))).toBe(before)
  })
})

describe('resolveBrowseTrack', () => {
  it('keeps a real track name', () => {
    expect(resolveBrowseTrack('Protocols')).toBe('Protocols')
    expect(resolveBrowseTrack('Governance & Risk')).toBe('Governance & Risk')
  })

  it.each([null, undefined, '', 'Executive', 'protocols', 'Nope'])(
    'ignores %j and shows all tracks',
    (raw) => {
      expect(resolveBrowseTrack(raw)).toBe(BROWSE_ALL)
    }
  )

  it('every catalogue module belongs to a track resolveBrowseTrack accepts', () => {
    for (const t of MODULE_TRACKS) expect(resolveBrowseTrack(t.track)).toBe(t.track)
    expect(Object.keys(MODULE_CATALOG).length).toBeGreaterThanOrEqual(all.length)
  })
})
