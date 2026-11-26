// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ResourceStepper } from './ResourceStepper'
import { buildResourceTabs, START_NAV, type CardNav } from './resourceTabs'
import type { RenderableAnswer } from './answerRules'
import { broadMatch, makeRow } from '@/test/fixtures/assistantAnswers'

// Two Learn rows, one Compliance row, one Library row: Top 5, Learn, Compliance, Library.
const answer = {
  ...(broadMatch as RenderableAnswer),
  groups: [
    {
      name: 'Learn' as const,
      rows: [
        makeRow({
          kind: 'Module',
          tag: 'LM-001',
          title: 'First lesson',
          action: 'Go to module',
          group: 'Learn',
        }),
        makeRow({
          kind: 'Module',
          tag: 'LM-002',
          title: 'Second lesson',
          action: 'Go to module',
          group: 'Learn',
        }),
      ],
      more: [],
    },
    {
      name: 'Data pages' as const,
      rows: [
        makeRow({
          kind: 'Compliance framework',
          tag: 'CMP:a',
          title: 'A framework',
          action: 'Go to page',
          group: 'Data pages',
        }),
      ],
      more: [],
    },
    {
      name: 'References' as const,
      rows: [
        makeRow({
          kind: 'Library document',
          tag: 'LIB:a',
          title: 'A document',
          action: 'Read here',
          group: 'References',
        }),
      ],
      more: [],
    },
  ],
} as RenderableAnswer

const built = buildResourceTabs(answer)

function show(start: CardNav = START_NAV, onAction = vi.fn()) {
  function Harness() {
    const [nav, setNav] = useState(start)
    return (
      <ResourceStepper
        tabs={built.tabs}
        rankOf={built.rankOf}
        nav={nav}
        onNav={setNav}
        panelId="panel"
        tabId={(k) => `tab-${k}`}
        question="A question"
        onAction={onAction}
      />
    )
  }
  render(<Harness />)
  return onAction
}

const footerLabel = () => screen.getByText(/ · \d+ of \d+$/)

describe('ResourceStepper', () => {
  it('keeps the action row below the text area, not sticky (a sticky bar floats over the text in a short list)', () => {
    show({ tab: 'library', index: 0 })
    const action = screen.getByRole('button', { name: 'Read here: A document' })
    expect(action.parentElement).not.toHaveClass('sticky')
    expect(action.parentElement).toHaveClass('shrink-0')
  })

  it('shows one resource at a time, with one dot per resource and the position in the footer', () => {
    show()
    expect(built.tabs.map((t) => t.key)).toEqual(['top', 'learn', 'compliance', 'library'])
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-top')
    expect(within(panel).getAllByRole('heading')).toHaveLength(1)
    expect(within(panel).getByRole('heading')).toHaveTextContent('First lesson')
    expect(footerLabel()).toHaveTextContent('Top 5 · 1 of 4')
    expect(footerLabel()).toHaveAttribute('aria-live', 'polite')
    const dots = document.querySelectorAll('[aria-hidden="true"] > span')
    expect(dots).toHaveLength(4)
  })

  it('Next moves inside the tab', async () => {
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole('button', { name: 'Next resource' }))
    expect(screen.getByRole('heading')).toHaveTextContent('Second lesson')
    expect(footerLabel()).toHaveTextContent('Top 5 · 2 of 4')
  })

  it('at the end of a tab, Next goes to the first resource of the next tab and says so', async () => {
    const user = userEvent.setup()
    show({ tab: 'learn', index: 1 })
    const next = screen.getByRole('button', { name: 'Next resource type: Compliance' })
    expect(next).toHaveTextContent('Next: Compliance ›')
    await user.click(next)
    expect(screen.getByRole('heading')).toHaveTextContent('A framework')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-compliance')
    expect(footerLabel()).toHaveTextContent('Compliance · 1 of 1')
  })

  it('Prev at the start of a tab goes to the last resource of the previous tab', async () => {
    const user = userEvent.setup()
    show({ tab: 'compliance', index: 0 })
    const prev = screen.getByRole('button', { name: 'Previous resource type: Learn' })
    expect(prev).toHaveTextContent('‹ Prev: Learn')
    await user.click(prev)
    expect(screen.getByRole('heading')).toHaveTextContent('Second lesson')
    expect(footerLabel()).toHaveTextContent('Learn · 2 of 2')
  })

  it('reads "End" on the last resource, with aria-disabled and not disabled, and Prev is disabled the same way at the start', async () => {
    const user = userEvent.setup()
    show({ tab: 'library', index: 0 })
    const end = screen.getByRole('button', { name: 'No more resources' })
    expect(end).toHaveTextContent('End')
    expect(end).toHaveAttribute('aria-disabled', 'true')
    expect(end).not.toBeDisabled()
    end.focus()
    await user.click(end)
    expect(end).toHaveFocus()
    expect(screen.getByRole('heading')).toHaveTextContent('A document')
  })

  it('has a Prev that does nothing at the very start', async () => {
    const user = userEvent.setup()
    show()
    const prev = screen.getByRole('button', { name: 'No earlier resources' })
    expect(prev).toHaveAttribute('aria-disabled', 'true')
    await user.click(prev)
    expect(screen.getByRole('heading')).toHaveTextContent('First lesson')
  })

  it('keeps keyboard focus on the button that was pressed', async () => {
    const user = userEvent.setup()
    show()
    const next = screen.getByRole('button', { name: 'Next resource' })
    next.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /^Next resource/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    // now on Compliance after crossing; the same element still holds focus
    expect(screen.getByRole('button', { name: /^Next resource/ })).toHaveFocus()
  })

  it('steps through every resource with Next alone, crossing types, and ends', async () => {
    const user = userEvent.setup()
    show()
    const seen: string[] = []
    for (let i = 0; i < 20; i++) {
      seen.push(screen.getByRole('heading').textContent ?? '')
      const next = screen.getByRole('button', { name: /^(Next resource|No more resources)/ })
      if (next.getAttribute('aria-disabled') === 'true') break
      await user.click(next)
    }
    expect(new Set(seen)).toEqual(
      new Set(['First lesson', 'Second lesson', 'A framework', 'A document'])
    )
    // the four of "Top 5", then each type's own resources
    expect(seen).toHaveLength(4 + 4)
  })

  it('names the primary action with the resource, and passes the resource to it', async () => {
    const user = userEvent.setup()
    const onAction = show({ tab: 'library', index: 0 })
    await user.click(screen.getByRole('button', { name: 'Read here: A document' }))
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ tag: 'LIB:a' }))
  })
})
