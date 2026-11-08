// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MobileGuidedRoutingView } from './MobileGuidedRoutingView'
import {
  CROSSWALK_FRAMEWORKS,
  START_BRANCHES,
  crosswalkRows,
  phaseHeading,
  routingSourceNote,
} from '@/components/PKILearning/guidedRouting'

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{pathname + search}</div>
}

function renderGuided() {
  return render(
    <MemoryRouter initialEntries={['/learn?mode=guided']}>
      <MobileGuidedRoutingView />
      <Where />
    </MemoryRouter>
  )
}

const choice = (question: string) => screen.getByRole('button', { name: new RegExp(question) })

describe('MobileGuidedRoutingView — choosing where to start', () => {
  it('offers the six shared statements as full-width choices at least 56 px tall', () => {
    renderGuided()
    const buttons = within(screen.getByRole('list')).getAllByRole('button')
    expect(buttons).toHaveLength(6)
    expect(buttons.map((b) => b.textContent)).toEqual(START_BRANCHES.map((b) => b.question))
    for (const button of buttons) {
      expect(button).toHaveClass('w-full')
      expect(button).toHaveClass('min-h-14') // 3.5rem = 56 px
      expect(button).toHaveClass('whitespace-normal') // long statements wrap instead of overflowing
    }
  })

  it('choosing a statement shows why, which phase, and a start button naming the first stop', async () => {
    const user = userEvent.setup()
    renderGuided()
    const branch = START_BRANCHES[0]
    await user.click(choice(branch.question))
    expect(screen.getByRole('heading', { level: 2, name: branch.question })).toBeInTheDocument()
    expect(screen.getByText(branch.rationale)).toBeInTheDocument()
    expect(screen.getByText(phaseHeading(branch.phase))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: branch.cta })).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it.each(START_BRANCHES.map((b) => [b.id, b] as const))(
    '%s: the start button opens its target',
    async (_id, branch) => {
      const user = userEvent.setup()
      renderGuided()
      await user.click(choice(branch.question))
      await user.click(screen.getByRole('button', { name: branch.cta }))
      expect(screen.getByTestId('where')).toHaveTextContent(branch.to)
    }
  )

  it('the start button spans the width and is at least 48 px tall', async () => {
    const user = userEvent.setup()
    renderGuided()
    await user.click(choice(START_BRANCHES[0].question))
    const start = screen.getByRole('button', { name: START_BRANCHES[0].cta })
    expect(start).toHaveClass('w-full')
    expect(start).toHaveClass('min-h-12')
  })

  it('"Back to all paths" returns to the six statements and puts focus on the one just chosen', async () => {
    const user = userEvent.setup()
    renderGuided()
    const branch = START_BRANCHES[2]
    await user.click(choice(branch.question))
    await user.click(screen.getByRole('button', { name: 'Back to all paths' }))
    expect(within(screen.getByRole('list')).getAllByRole('button')).toHaveLength(6)
    expect(choice(branch.question)).toHaveFocus()
  })

  it('moves focus to the answer’s heading when a statement is chosen', async () => {
    const user = userEvent.setup()
    renderGuided()
    await user.click(choice(START_BRANCHES[3].question))
    expect(
      screen.getByRole('heading', { level: 2, name: START_BRANCHES[3].question })
    ).toHaveFocus()
  })

  it('works from the keyboard alone: Tab to a statement, Enter to choose, Tab to start, Space to go', async () => {
    const user = userEvent.setup()
    renderGuided()
    const branch = START_BRANCHES[0]
    await user.tab()
    expect(choice(branch.question)).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 2, name: branch.question })).toHaveFocus()
    // Focus sits on the answer's heading, which comes after "Back to all paths"; Tab goes on to
    // the start button, and Shift+Tab reaches the way back.
    await user.tab()
    expect(screen.getByRole('button', { name: branch.cta })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Back to all paths' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: branch.cta })).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByTestId('where')).toHaveTextContent(branch.to)
  })
})

describe('MobileGuidedRoutingView — the framework crosswalk', () => {
  it('is a closed disclosure with the label above each value, one row per framework', async () => {
    const user = userEvent.setup()
    renderGuided()
    const branch = START_BRANCHES[1]
    await user.click(choice(branch.question))
    const summary = screen.getByText('This phase in other frameworks')
    const details = summary.closest('details')!
    expect(details).not.toHaveAttribute('open')
    await user.click(summary)
    expect(details).toHaveAttribute('open')
    const terms = within(details).getAllByRole('term')
    expect(terms.map((t) => t.textContent)).toEqual(CROSSWALK_FRAMEWORKS.map((f) => f.label))
    const rows = crosswalkRows(branch.phase)
    const definitions = within(details).getAllByRole('definition')
    expect(definitions.map((d) => d.textContent)).toEqual(rows.map((r) => r.text))
    // Label above value, not the desktop two-column grid.
    for (const term of terms) expect(term.parentElement).not.toHaveClass('grid')
  })

  it('names where the routing and the crosswalk come from', async () => {
    const user = userEvent.setup()
    renderGuided()
    expect(screen.getByText(routingSourceNote())).toBeInTheDocument()
    await user.click(choice(START_BRANCHES[0].question))
    expect(screen.getByText(routingSourceNote())).toBeInTheDocument()
  })
})
