// SPDX-License-Identifier: AGPL-3.0-only
//
// Play This Phase picker (WP2.4). The guarantee under test is unchanged: the
// spanning Foundations band is playable here, alongside every lifecycle phase,
// and the picker opens on whichever phase the player was already on.
//
// The assertions had to change because the picker did: it is a `FilterDropdown`,
// not a native `<select>`. `getAllByRole('option')` therefore found nothing (the
// options live in a portal that only exists while the menu is OPEN) and
// `getByRole('combobox')` found nothing (the trigger is a button with
// `aria-haspopup="listbox"`). Both failures were the test describing markup that
// no longer existed, not a regression in the picker — verified by driving the
// real component below, which does list Foundations.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SimPlayChoiceModal } from './SimPlayChoiceModal'
import { useSimulationStore } from '@/store/useSimulationStore'
import { autoRunWalkthroughQueue } from './autorun/simAutoRun'
import { overviewRouteSignature } from './autorun/overviewResume'

beforeEach(() => useSimulationStore.getState().reset())

describe('overview resume choices', () => {
  it('offers chapter resume and an explicit restart that clears the bookmark first', async () => {
    const user = userEvent.setup()
    useSimulationStore.getState().setOverviewBookmark({
      mode: 'walkthrough',
      phase: 'p3',
      routeSignature: overviewRouteSignature(autoRunWalkthroughQueue()),
    })
    const onStart = vi.fn(() => {
      expect(useSimulationStore.getState().overviewBookmark).toBeNull()
    })
    render(
      <SimPlayChoiceModal
        onClose={vi.fn()}
        onStart={onStart}
        defaultCard="walkthrough"
        defaultPhase="p0"
      />
    )
    expect(screen.getByRole('button', { name: '▶ Resume chapter' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Restart overview from beginning' }))
    expect(onStart).toHaveBeenCalledWith('walkthrough')
  })

  it('does not offer Resume for a changed resource route', () => {
    useSimulationStore.getState().setOverviewBookmark({
      mode: 'walkthrough',
      phase: 'p3',
      routeSignature: 'old-route',
    })
    render(
      <SimPlayChoiceModal
        onClose={vi.fn()}
        onStart={vi.fn()}
        defaultCard="walkthrough"
        defaultPhase="p0"
      />
    )
    expect(screen.queryByRole('button', { name: '▶ Resume chapter' })).toBeNull()
    expect(screen.getByText(/overview route has changed/)).toBeTruthy()
  })
})

/** Open the phase picker and return its option labels, in order. */
async function openPickerOptions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('filter-dropdown'))
  // The menu renders into a portal; options only exist once it is open.
  const options = await screen.findAllByRole('option')
  return options.map((o) => o.textContent ?? '')
}

describe('SimPlayChoiceModal — Play This Phase picker (WP2.4)', () => {
  it('includes Foundations as a playable phase, not just the 9 lifecycle phases', async () => {
    const user = userEvent.setup()
    render(
      <SimPlayChoiceModal
        onClose={vi.fn()}
        onStart={vi.fn()}
        defaultCard="climb"
        defaultPhase="p0"
      />
    )

    const options = await openPickerOptions(user)
    expect(options.some((t) => t.includes('Foundations'))).toBe(true)
    // still every lifecycle phase too — nothing lost in the switch to PHASE_ORDER.
    expect(options.some((t) => t.includes('Executive Mandate'))).toBe(true)
    expect(options.some((t) => t.includes('Verification'))).toBe(true)
  })

  it('defaults the picker to Foundations when the player was on that phase', async () => {
    const user = userEvent.setup()
    render(
      <SimPlayChoiceModal
        onClose={vi.fn()}
        onStart={vi.fn()}
        defaultCard="phase"
        defaultPhase="foundations"
      />
    )

    // The trigger shows the current selection, which is what the player sees.
    expect(screen.getByTestId('filter-dropdown').textContent).toContain('Foundations')

    // And the menu marks it selected, so the state is real and not just a label.
    await user.click(screen.getByTestId('filter-dropdown'))
    const selected = (await screen.findAllByRole('option')).filter(
      (o) => o.getAttribute('aria-selected') === 'true'
    )
    expect(selected).toHaveLength(1)
    expect(selected[0].textContent).toContain('Foundations')
  })
})
