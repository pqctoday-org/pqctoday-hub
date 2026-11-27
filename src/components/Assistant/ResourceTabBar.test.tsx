// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ResourceTabBar } from './ResourceTabBar'
import { buildResourceTabs, type ResourceTabKey } from './resourceTabs'
import type { RenderableAnswer } from './answerRules'
import { broadMatch, makeRow } from '@/test/fixtures/assistantAnswers'

const rows = [
  makeRow({ kind: 'Module', tag: 'LM-001', title: 'a', action: 'Go to module', group: 'Learn' }),
  makeRow({
    kind: 'Timeline event',
    tag: 'TL:a',
    title: 'b',
    action: 'Go to page',
    group: 'Data pages',
  }),
  makeRow({
    kind: 'Timeline event',
    tag: 'TL:b',
    title: 'c',
    action: 'Go to page',
    group: 'Data pages',
  }),
  makeRow({
    kind: 'Library document',
    tag: 'LIB:a',
    title: 'd',
    action: 'Read here',
    group: 'References',
  }),
]
const { tabs } = buildResourceTabs({
  ...(broadMatch as RenderableAnswer),
  groups: [{ name: 'Learn', rows, more: [] }],
} as RenderableAnswer)

function show(compact = false) {
  const picked: ResourceTabKey[] = []
  function Harness() {
    const [selected, setSelected] = useState<ResourceTabKey>('top')
    return (
      <ResourceTabBar
        tabs={tabs}
        selected={selected}
        onSelect={(k) => {
          picked.push(k)
          setSelected(k)
        }}
        panelId="panel"
        tabId={(k) => `tab-${k}`}
        compact={compact}
      />
    )
  }
  render(<Harness />)
  return picked
}

describe('ResourceTabBar', () => {
  it('is a tablist of resource types; each tab has the type and the count in its name', () => {
    show()
    expect(screen.getByRole('tablist', { name: 'Resource types' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-label'))).toEqual([
      'Top 5, 4 resources',
      'Learn, 1 resource',
      'Timeline, 2 resources',
      'Library, 1 resource',
    ])
    for (const tab of screen.getAllByRole('tab'))
      expect(tab).toHaveAttribute('aria-controls', 'panel')
  })

  it('keeps one tab in the tab order (roving) and marks the selected one', () => {
    show()
    const all = screen.getAllByRole('tab')
    expect(all.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    expect(all[0]).toHaveAttribute('aria-selected', 'true')
    expect(all[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('Left and Right move and select, wrapping; Home and End go to the ends; focus stays on the tab', async () => {
    const user = userEvent.setup()
    const picked = show()
    screen.getByRole('tab', { name: /^Top 5/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /^Learn/ })).toHaveFocus()
    expect(screen.getByRole('tab', { name: /^Learn/ })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: /^Library/ })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /^Top 5/ })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: /^Library/ })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: /^Top 5/ })).toHaveFocus()
    expect(picked).toEqual(['learn', 'library', 'top', 'library', 'top'])
  })

  it('carries the tooltip text "Timeline · 2", shown on hover and on keyboard focus', () => {
    show()
    const tab = screen.getByRole('tab', { name: /^Timeline/ })
    const tip = tab.querySelector('span[aria-hidden="true"].absolute')
    expect(tip).toHaveTextContent('Timeline · 2')
    expect(tip?.className).toContain('group-focus-visible:opacity-100')
    expect(tip?.className).toContain('group-hover:opacity-100')
  })

  it('on the phone the tooltip shows on focus only, and the selected name is not repeated at the row end', () => {
    show(true)
    const tip = screen.getByRole('tab', { name: /^Timeline/ }).querySelector('span.absolute')
    expect(tip?.className).toContain('group-focus-visible:opacity-100')
    expect(tip?.className).not.toContain('group-hover:opacity-100')
    expect(screen.queryByText('Top 5', { selector: 'span.text-heading' })).toBeNull()
  })

  it('on a wide screen the selected type name shows at the end of the row', () => {
    show(false)
    expect(screen.getByText('Top 5', { selector: 'span.text-heading' })).toBeInTheDocument()
  })
})
