// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MobileBrowseAllView } from './MobileBrowseAllView'
import { DESKTOP_ONLY_WORKSHOP_LABEL, workshopRunsOnPhone } from '../desktopOnlyWorkshop'
import { MODULE_TRACKS } from '@/components/PKILearning/moduleData'
import {
  TOTAL_MODULE_COUNT,
  filterAndSortModules,
} from '@/components/PKILearning/redesign/learnRedesign.helpers'
import { MODULE_TOPIC_KEYWORDS } from '@/data/moduleTopicSummaries'
import { useModuleStore } from '@/store/useModuleStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'

const all = MODULE_TRACKS.flatMap((t) => t.modules)

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{pathname + search}</div>
}

function renderBrowse(initial = '/learn?mode=browse') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <MobileBrowseAllView />
      <Where />
    </MemoryRouter>
  )
}

const where = () => screen.getByTestId('where').textContent ?? ''
const list = () => screen.getByTestId('mobile-browse-list')
const rows = () => within(list()).getAllByRole('link')
const searchBox = () => screen.getByRole('searchbox', { name: 'Search modules' })
const openFilters = () => fireEvent.click(screen.getByRole('button', { name: /^Filters/ }))
const sheet = () => screen.getByRole('dialog', { name: 'Filters' })

beforeEach(() => {
  useModuleStore.setState({ modules: {} })
  useBookmarkStore.setState({ myLearnModules: [] })
})

describe('MobileBrowseAllView — the whole catalogue on a phone', () => {
  it('lists every catalogue module exactly once, each as a link to its module page', () => {
    renderBrowse()
    const hrefs = rows().map((a) => a.getAttribute('href'))
    expect(hrefs).toHaveLength(TOTAL_MODULE_COUNT)
    expect(new Set(hrefs).size).toBe(TOTAL_MODULE_COUNT)
    expect([...hrefs].sort()).toEqual(all.map((m) => `/learn/${m.id}`).sort())
  })

  it('groups the rows under a heading per track, in catalogue order, with its module count', () => {
    renderBrowse()
    const headings = within(list()).getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.firstChild?.textContent)).toEqual(
      MODULE_TRACKS.map((t) => t.track)
    )
    MODULE_TRACKS.forEach((t, i) => expect(headings[i]).toHaveTextContent(String(t.modules.length)))
  })

  it('says how many of the catalogue it shows, as a status message', () => {
    renderBrowse()
    expect(screen.getByRole('status')).toHaveTextContent(
      `Showing ${TOTAL_MODULE_COUNT} of ${TOTAL_MODULE_COUNT}`
    )
  })

  it('searches title, description and topic keywords, and narrows the list', async () => {
    renderBrowse()
    fireEvent.change(searchBox(), { target: { value: 'HSM' } })
    const expected = (keywords: Record<string, string> | null) =>
      filterAndSortModules({ tracks: MODULE_TRACKS, search: 'HSM', topicKeywords: keywords })
        .flatMap((g) => g.modules)
        .map((m) => `/learn/${m.id}`)
    await waitFor(() =>
      expect(rows().map((a) => a.getAttribute('href'))).toEqual(expected(MODULE_TOPIC_KEYWORDS))
    )
    const found = rows().length
    expect(found).toBeGreaterThan(0)
    expect(found).toBeLessThan(TOTAL_MODULE_COUNT)
    expect(screen.getByRole('status')).toHaveTextContent(`Showing ${found} of`)
  })

  it('keeps the search words in the address, so the link can be shared', () => {
    renderBrowse()
    fireEvent.change(searchBox(), { target: { value: 'TLS' } })
    expect(where()).toBe('/learn?mode=browse&q=TLS')
    fireEvent.change(searchBox(), { target: { value: '' } })
    expect(where()).toBe('/learn?mode=browse')
  })

  it('opens with the search words from a shared link already applied', () => {
    renderBrowse('/learn?mode=browse&q=zzzznotaword')
    expect(searchBox()).toHaveValue('zzzznotaword')
    expect(screen.getByText('No modules match your filters.')).toBeInTheDocument()
  })

  it('shows an empty state with a way back, and the way back restores the whole list', () => {
    renderBrowse('/learn?mode=browse&track=Protocols&q=zzzznotaword')
    expect(screen.getByText('No modules match your filters.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(rows()).toHaveLength(TOTAL_MODULE_COUNT)
    expect(where()).toBe('/learn?mode=browse')
    expect(searchBox()).toHaveValue('')
  })

  it('does not need a role: the list is the same with and without one', () => {
    renderBrowse()
    expect(rows()).toHaveLength(TOTAL_MODULE_COUNT)
    expect(screen.queryByText(/pick a role/i)).not.toBeInTheDocument()
  })
})

describe('MobileBrowseAllView — typing in the search box', () => {
  it('typed character by character, the box, the address and the list all follow', async () => {
    const user = userEvent.setup()
    renderBrowse()
    await user.type(searchBox(), 'hsm')
    expect(searchBox()).toHaveValue('hsm')
    expect(where()).toBe('/learn?mode=browse&q=hsm')
    await waitFor(() => expect(rows().length).toBeLessThan(TOTAL_MODULE_COUNT))
  })

  it('an edit in the middle of the text keeps the caret edit, not the end of the text', async () => {
    const user = userEvent.setup()
    renderBrowse('/learn?mode=browse&q=hm')
    const box = searchBox() as HTMLInputElement
    box.focus()
    box.setSelectionRange(1, 1)
    await user.keyboard('s')
    expect(box).toHaveValue('hsm')
    expect(where()).toBe('/learn?mode=browse&q=hsm')
  })

  it('backspacing to nothing empties the box and removes q from the address', async () => {
    const user = userEvent.setup()
    renderBrowse('/learn?mode=browse&q=ab')
    await user.type(searchBox(), '{Backspace}{Backspace}')
    expect(searchBox()).toHaveValue('')
    expect(where()).toBe('/learn?mode=browse')
  })

  it('a link that changes ?q= while the screen is open replaces the box text', () => {
    render(
      <MemoryRouter initialEntries={['/learn?mode=browse&q=tls']}>
        <MobileBrowseAllView />
        <Link to="/learn?mode=browse&q=hsm">other link</Link>
      </MemoryRouter>
    )
    expect(searchBox()).toHaveValue('tls')
    fireEvent.click(screen.getByRole('link', { name: 'other link' }))
    expect(searchBox()).toHaveValue('hsm')
  })
})

describe('MobileBrowseAllView — focus is kept when a pressed button goes away', () => {
  it('"Clear filters" hands focus to the result line, which reads the full count again', async () => {
    const user = userEvent.setup()
    renderBrowse('/learn?mode=browse&q=zzzznotaword')
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.queryByText('No modules match your filters.')).not.toBeInTheDocument()
    const status = screen.getByRole('status')
    expect(status).toHaveFocus()
    expect(status).toHaveTextContent(`Showing ${TOTAL_MODULE_COUNT} of ${TOTAL_MODULE_COUNT}`)
    expect(document.body).not.toHaveFocus()
  })
})

describe('MobileBrowseAllView — track chips and the address', () => {
  it('?track= preselects that chip and lists only that track', () => {
    renderBrowse('/learn?mode=browse&track=Protocols')
    const chip = screen.getByRole('button', { name: /^Protocols · \d+$/ })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^All tracks/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    const protocols = MODULE_TRACKS.find((t) => t.track === 'Protocols')!.modules
    expect(rows().map((a) => a.getAttribute('href'))).toEqual(
      protocols.map((m) => `/learn/${m.id}`)
    )
  })

  it('a track whose name has spaces and an ampersand is found from its encoded link', () => {
    renderBrowse('/learn?mode=browse&track=Governance%20%26%20Risk')
    expect(screen.getByRole('button', { name: /^Governance & Risk · \d+$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it.each(['Executive', 'protocols', 'Nope', ''])(
    'an unknown track %j is ignored and the whole catalogue shows',
    (track) => {
      renderBrowse(`/learn?mode=browse&track=${track}`)
      expect(rows()).toHaveLength(TOTAL_MODULE_COUNT)
      expect(screen.getByRole('button', { name: /^All tracks/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    }
  )

  it('choosing a chip narrows the list and writes the track to the address; All tracks removes it', () => {
    renderBrowse()
    fireEvent.click(screen.getByRole('button', { name: /^Strategy · \d+$/ }))
    expect(where()).toBe('/learn?mode=browse&track=Strategy')
    expect(rows()).toHaveLength(MODULE_TRACKS.find((t) => t.track === 'Strategy')!.modules.length)
    fireEvent.click(screen.getByRole('button', { name: /^All tracks/ }))
    expect(where()).toBe('/learn?mode=browse')
    expect(rows()).toHaveLength(TOTAL_MODULE_COUNT)
  })

  it('follows the address when a link changes it while the screen is open (an assistant link)', () => {
    render(
      <MemoryRouter initialEntries={['/learn?mode=browse&track=Protocols']}>
        <MobileBrowseAllView />
        <Link to="/learn?mode=browse&track=Industries">assistant link</Link>
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /^Protocols · \d+$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    fireEvent.click(screen.getByRole('link', { name: 'assistant link' }))
    expect(screen.getByRole('button', { name: /^Industries · \d+$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    const industries = MODULE_TRACKS.find((t) => t.track === 'Industries')!.modules
    expect(rows().map((a) => a.getAttribute('href'))).toEqual(
      industries.map((m) => `/learn/${m.id}`)
    )
  })
})

describe('MobileBrowseAllView — status, sort and saved filters', () => {
  it('filters by status in the Filters sheet, and the button counts the active filters', () => {
    useModuleStore.setState({
      modules: {
        [all[0].id]: { status: 'completed' },
        [all[1].id]: { status: 'in-progress' },
      } as never,
    })
    renderBrowse()
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
    openFilters()
    fireEvent.click(within(sheet()).getByRole('radio', { name: 'Completed' }))
    fireEvent.click(within(sheet()).getByRole('button', { name: /^Show 1 module$/ }))
    expect(rows().map((a) => a.getAttribute('href'))).toEqual([`/learn/${all[0].id}`])
    expect(screen.getByRole('button', { name: /^Filters\s*\(1 active\)$/ })).toBeInTheDocument()
  })

  it('sorts A to Z within each track', () => {
    renderBrowse('/learn?mode=browse&track=Protocols')
    openFilters()
    fireEvent.click(within(sheet()).getByRole('radio', { name: 'Name A–Z' }))
    const titles = MODULE_TRACKS.find((t) => t.track === 'Protocols')!.modules.map((m) => m.title)
    const sorted = [...titles].sort((a, b) => a.localeCompare(b))
    const shown = rows().map((a) => a.getAttribute('href'))
    const byTitle = Object.fromEntries(all.map((m) => [`/learn/${m.id}`, m.title]))
    expect(shown.map((h) => byTitle[h!])).toEqual(sorted)
  })

  it('shows only saved modules when asked, and says how many are saved', () => {
    useBookmarkStore.setState({ myLearnModules: [all[2].id, all[5].id] })
    renderBrowse()
    openFilters()
    expect(within(sheet()).getByLabelText('Saved modules only (2)')).toBeInTheDocument()
    fireEvent.click(within(sheet()).getByLabelText('Saved modules only (2)'))
    expect(rows().map((a) => a.getAttribute('href'))).toEqual([
      `/learn/${all[2].id}`,
      `/learn/${all[5].id}`,
    ])
  })

  it('resets the sheet filters but leaves the search and track alone, and keeps focus on the button', async () => {
    const user = userEvent.setup()
    renderBrowse('/learn?mode=browse&track=Protocols')
    openFilters()
    fireEvent.click(within(sheet()).getByRole('radio', { name: 'Completed' }))
    const reset = within(sheet()).getByRole('button', { name: 'Reset filters' })
    await user.click(reset)
    expect(within(sheet()).getByRole('radio', { name: 'All statuses' })).toBeChecked()
    expect(where()).toContain('track=Protocols')
    // It used to disable itself while pressed, which dropped keyboard focus out of the sheet.
    expect(reset).toBeEnabled()
    expect(reset).toHaveFocus()
  })

  it('closes the sheet with Escape and gives focus back to the Filters button', () => {
    renderBrowse()
    const button = screen.getByRole('button', { name: /^Filters/ })
    button.focus()
    fireEvent.click(button)
    expect(sheet()).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })
})

describe('MobileBrowseAllView — each row', () => {
  it('names the reader’s progress in text, not only by icon', () => {
    useModuleStore.setState({
      modules: {
        [all[0].id]: { status: 'completed' },
        [all[1].id]: { status: 'in-progress' },
      } as never,
    })
    renderBrowse()
    const link = (id: string) => rows().find((a) => a.getAttribute('href') === `/learn/${id}`)!
    expect(link(all[0].id)).toHaveAccessibleName(
      new RegExp(`^Completed:\\s*${escapeRe(all[0].title)}`)
    )
    expect(link(all[1].id)).toHaveAccessibleName(
      new RegExp(`^In progress:\\s*${escapeRe(all[1].title)}`)
    )
    expect(link(all[2].id)).toHaveAccessibleName(
      new RegExp(`^Not started:\\s*${escapeRe(all[2].title)}`)
    )
  })

  it('says "Workshop: on a computer" on exactly the modules whose workshop does not run on a phone', () => {
    renderBrowse()
    const expected = all.filter((m) => !workshopRunsOnPhone(m.id)).map((m) => `/learn/${m.id}`)
    expect(expected.length).toBeGreaterThan(0)
    expect(expected.length).toBeLessThan(all.length)
    const captioned = rows()
      .filter((a) => within(a).queryByText(DESKTOP_ONLY_WORKSHOP_LABEL))
      .map((a) => a.getAttribute('href'))
    expect([...captioned].sort()).toEqual([...expected].sort())
  })

  it('has a separate Save button beside the link, not inside it', () => {
    renderBrowse()
    const first = all[0]
    const save = screen.getByRole('button', { name: `Save ${first.title}` })
    const link = rows().find((a) => a.getAttribute('href') === `/learn/${first.id}`)!
    expect(link.contains(save)).toBe(false)
    expect(save.closest('li')).toBe(link.closest('li'))
  })

  it('saves and unsaves through the same store the desktop uses, and reflects it back', () => {
    renderBrowse()
    const first = all[0]
    const save = () => screen.getByRole('button', { name: `Save ${first.title}` })
    expect(save()).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(save())
    expect(useBookmarkStore.getState().myLearnModules).toContain(first.id)
    expect(save()).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(save())
    expect(useBookmarkStore.getState().myLearnModules).not.toContain(first.id)
    expect(save()).toHaveAttribute('aria-pressed', 'false')
  })

  it('a module saved elsewhere (the desktop store) shows as saved here', () => {
    useBookmarkStore.setState({ myLearnModules: [all[3].id] })
    renderBrowse()
    expect(screen.getByRole('button', { name: `Save ${all[3].title}` })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})

function escapeRe(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
