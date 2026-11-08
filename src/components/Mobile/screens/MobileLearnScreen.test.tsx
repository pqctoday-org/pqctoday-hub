// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { MobileLearnScreen } from './MobileLearnScreen'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useModuleStore } from '@/store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'
import { MODULE_TRACKS } from '@/components/PKILearning/moduleData'
import { TOTAL_MODULE_COUNT } from '@/components/PKILearning/redesign/learnRedesign.helpers'
import { START_BRANCHES } from '@/components/PKILearning/guidedRouting'

// MobileWorkshopEntry has its own dedicated, thoroughly-fixtured test suite
// (MobileWorkshopEntry.test.tsx) covering its internal idle/paused/running
// gating — mocked here to a simple marker so this file only asserts on what
// R4.5 actually changed: WHERE it renders, not its own internal logic.
vi.mock('../shell/MobileWorkshopEntry', () => ({
  MobileWorkshopEntry: () => <div data-testid="workshop-entry-marker" />,
}))

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{pathname + search}</div>
}

function renderScreen(initialPath = '/learn') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MobileLearnScreen />
      <Where />
    </MemoryRouter>
  )
}

const where = () => screen.getByTestId('where').textContent ?? ''
const browseTab = () => screen.getByRole('tab', { name: `Browse all ${TOTAL_MODULE_COUNT}` })
const guidedTab = () => screen.getByRole('tab', { name: 'Guided' })
const myPathTab = () => screen.getByRole('tab', { name: 'My Path' })

afterEach(() => {
  usePersonaStore.getState().setPersona(null)
  useModuleStore.setState({ modules: {} })
})

describe('MobileLearnScreen', () => {
  it('defaults to My Path mode', () => {
    renderScreen()
    expect(screen.getByRole('tab', { name: 'My Path', selected: true })).toBeInTheDocument()
  })

  it('prompts to pick a role when no persona is selected', () => {
    renderScreen()
    expect(screen.getByText('Pick a role for a guided path tuned to you.')).toBeInTheDocument()
  })

  it('shows the real My Path content once a persona is selected', () => {
    usePersonaStore.getState().setPersona('executive')
    renderScreen()
    expect(
      screen.getByText(new RegExp(`Essentials — the core ${PERSONAS.executive.essentials.length}`))
    ).toBeInTheDocument()
  })

  it('offers My Path, Browse all and Guided tabs', () => {
    renderScreen()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'My Path',
      `Browse all ${TOTAL_MODULE_COUNT}`,
      'Guided',
    ])
  })

  it('says only what really stays on the desktop site: the workforce view and the algorithm and standard filters', () => {
    renderScreen()
    expect(
      screen.getByText(
        'The workforce (NICE) view and the algorithm and standard filters are on the desktop site.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText('The full module catalogue and guided routing are on the desktop site.')
    ).not.toBeInTheDocument()
  })

  // 2026-08-24 audit R4.5: the guided workshop was reachable only from Home
  // — invisible from the education hub itself. MobileWorkshopEntry already
  // self-gates (renders nothing idle-with-no-flow/running/video); this only
  // asserts on placement, not on that internal logic (covered separately).
  it('does not render the workshop entry with no persona picked yet', () => {
    renderScreen()
    expect(screen.queryByTestId('workshop-entry-marker')).not.toBeInTheDocument()
  })

  it('renders the workshop entry on the My Path tab once a persona is picked', () => {
    usePersonaStore.getState().setPersona('executive')
    renderScreen()
    expect(screen.getByTestId('workshop-entry-marker')).toBeInTheDocument()
  })
})

describe('MobileLearnScreen: the page names itself', () => {
  // The phone header title is plain text, so this screen provides the page's one level-one heading.
  it('has exactly one h1, "Learn", with and without a role', () => {
    renderScreen()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Learn' })).toBeInTheDocument()
  })

  it('still has exactly one once a role is selected', () => {
    usePersonaStore.getState().setPersona('executive')
    renderScreen()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})

describe('MobileLearnScreen: Browse all and Guided are on the phone', () => {
  it('opens Browse all from the tab, shows the whole catalogue, and keeps the choice in the address', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(browseTab())
    expect(browseTab()).toHaveAttribute('aria-selected', 'true')
    expect(where()).toBe('/learn?mode=browse')
    const links = within(screen.getByTestId('mobile-browse-list')).getAllByRole('link')
    expect(links).toHaveLength(TOTAL_MODULE_COUNT)
  })

  it('opens Guided from the tab and offers the six statements', async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(guidedTab())
    expect(guidedTab()).toHaveAttribute('aria-selected', 'true')
    expect(where()).toBe('/learn?mode=guided')
    expect(within(screen.getByRole('list')).getAllByRole('button')).toHaveLength(
      START_BRANCHES.length
    )
  })

  // Before 4.200.0 these two links opened My Path on a phone.
  it('?mode=browse opens Browse all', () => {
    renderScreen('/learn?mode=browse')
    expect(browseTab()).toHaveAttribute('aria-selected', 'true')
    expect(myPathTab()).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('mobile-browse-all')).toBeInTheDocument()
    expect(
      screen.queryByText('Pick a role for a guided path tuned to you.')
    ).not.toBeInTheDocument()
  })

  it('?mode=guided opens Guided', () => {
    renderScreen('/learn?mode=guided')
    expect(guidedTab()).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('mobile-guided-choices')).toBeInTheDocument()
  })

  it.each([['/learn'], ['/learn?mode=mypath'], ['/learn?mode=nonsense'], ['/learn?view=nice']])(
    '%s opens My Path (the workforce view is desktop-only)',
    (path) => {
      renderScreen(path)
      expect(myPathTab()).toHaveAttribute('aria-selected', 'true')
    }
  )

  it('?mode=browse&track=Protocols preselects the Protocols chip and lists only that track', () => {
    renderScreen('/learn?mode=browse&track=Protocols')
    expect(screen.getByRole('button', { name: /^Protocols · \d+$/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    const protocols = MODULE_TRACKS.find((t) => t.track === 'Protocols')!.modules
    expect(within(screen.getByTestId('mobile-browse-list')).getAllByRole('link')).toHaveLength(
      protocols.length
    )
  })

  it('ignores a track that is not in the catalogue (the assistant used to name an "Executive" track)', () => {
    renderScreen('/learn?mode=browse&track=Executive')
    expect(screen.getByRole('button', { name: /^All tracks/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(within(screen.getByTestId('mobile-browse-list')).getAllByRole('link')).toHaveLength(
      TOTAL_MODULE_COUNT
    )
  })

  it('needs no role for Browse all or Guided', () => {
    renderScreen('/learn?mode=browse')
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
    expect(screen.getByTestId('mobile-browse-list')).toBeInTheDocument()
    fireEvent.click(guidedTab())
    expect(screen.getByTestId('mobile-guided-choices')).toBeInTheDocument()
  })

  it('leaving Browse all drops its track and search words from the address', async () => {
    const user = userEvent.setup()
    renderScreen('/learn?mode=browse&track=Protocols&q=tls')
    await user.click(myPathTab())
    expect(where()).toBe('/learn?mode=mypath')
  })

  it('shows My Path for a role as before, and the workshop entry only there', async () => {
    const user = userEvent.setup()
    usePersonaStore.getState().setPersona('executive')
    renderScreen('/learn?mode=browse')
    expect(screen.queryByTestId('workshop-entry-marker')).not.toBeInTheDocument()
    await user.click(myPathTab())
    expect(screen.getByTestId('workshop-entry-marker')).toBeInTheDocument()
  })
})

describe('MobileLearnScreen: the tabs follow the tabs pattern', () => {
  it('each tab controls a labelled tab panel, and only the selected panel has content', () => {
    renderScreen('/learn?mode=browse')
    for (const tab of screen.getAllByRole('tab')) {
      const panelId = tab.getAttribute('aria-controls')!
      const panel = document.getElementById(panelId)!
      expect(panel).toHaveAttribute('role', 'tabpanel')
      expect(panel).toHaveAttribute('aria-labelledby', tab.id)
      expect(panel.hasAttribute('hidden')).toBe(tab.getAttribute('aria-selected') !== 'true')
    }
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1) // hidden panels are not exposed
  })

  it('only the selected tab is in the tab order', () => {
    renderScreen('/learn?mode=guided')
    expect(guidedTab()).toHaveAttribute('tabindex', '0')
    expect(myPathTab()).toHaveAttribute('tabindex', '-1')
    expect(browseTab()).toHaveAttribute('tabindex', '-1')
  })

  it('arrow keys move between the tabs and open the one reached; focus follows', async () => {
    const user = userEvent.setup()
    renderScreen()
    myPathTab().focus()
    await user.keyboard('{ArrowRight}')
    expect(browseTab()).toHaveFocus()
    expect(browseTab()).toHaveAttribute('aria-selected', 'true')
    expect(where()).toBe('/learn?mode=browse')
    await user.keyboard('{ArrowRight}')
    expect(guidedTab()).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(myPathTab()).toHaveFocus() // wraps around
    await user.keyboard('{ArrowLeft}')
    expect(guidedTab()).toHaveFocus()
  })

  // The address, and so the mode, updates a moment after a key press. A second press that arrives
  // before it must count from the tab that took it. Measured from the old mode, both presses went
  // to Browse all and Guided was never reached.
  it('two quick arrow presses before the address updates still reach the third tab', () => {
    renderScreen()
    // Both presses must land in one batch, before the router's update is applied; separate
    // awaited presses (user-event) would let it settle in between and hide the bug.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      fireEvent.keyDown(myPathTab(), { key: 'ArrowRight' })
      fireEvent.keyDown(browseTab(), { key: 'ArrowRight' })
    })
    expect(guidedTab()).toHaveAttribute('aria-selected', 'true')
    expect(where()).toBe('/learn?mode=guided')
  })

  it.each([['altKey'], ['metaKey'], ['ctrlKey']])(
    'leaves %s + arrow to the browser (Back and Forward shortcuts): no tab change, not cancelled',
    (modifier) => {
      renderScreen()
      const notCancelled = fireEvent.keyDown(myPathTab(), {
        key: 'ArrowRight',
        [modifier]: true,
      })
      expect(notCancelled).toBe(true)
      expect(myPathTab()).toHaveAttribute('aria-selected', 'true')
      expect(where()).toBe('/learn')
    }
  )

  it('plain arrow keys are still cancelled, so the page does not scroll sideways', () => {
    renderScreen()
    expect(fireEvent.keyDown(myPathTab(), { key: 'ArrowRight' })).toBe(false)
  })

  it('Home and End jump to the first and last tab', async () => {
    const user = userEvent.setup()
    renderScreen('/learn?mode=browse')
    browseTab().focus()
    await user.keyboard('{End}')
    expect(guidedTab()).toHaveFocus()
    expect(guidedTab()).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(myPathTab()).toHaveFocus()
    expect(myPathTab()).toHaveAttribute('aria-selected', 'true')
  })

  it('the strip scrolls sideways instead of widening the page', () => {
    renderScreen()
    const strip = screen.getByRole('tablist', { name: 'Learn view' })
    expect(strip).toHaveClass('overflow-x-auto')
  })
})
