// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { resolveToolLink, toolLinkLabel, toolLinkTitle } from './matrixToolLink'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import { MobileProtocolMatrixView } from '@/components/Mobile/screens/MobileProtocolMatrixView'

const withTools = PROTOCOL_MATRIX.filter((r) => r.playgrounds.length > 0)

/** label -> destination of every playground chip the matrix shows for one row. */
function desktopChips(rowId: string): Map<string, string> {
  const { container, unmount } = render(
    <MemoryRouter initialEntries={['/algorithms?tab=support&matrixView=detailed']}>
      <PQCProtocolMatrix />
    </MemoryRouter>
  )
  // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
  const card = container.querySelector(`[data-deeplink-id="${rowId}"]`) as HTMLElement
  const row = PROTOCOL_MATRIX.find((r) => r.id === rowId)!
  // The "Try it" section is inside the expanded card.
  fireEvent.click(within(card).getByRole('button', { name: `Expand ${row.name}` }))
  const chips = new Map<string, string>()
  for (const tool of row.playgrounds) {
    const href = resolveToolLink(tool)
    const link = within(card).getByRole('link', { name: toolLinkLabel(tool, href) })
    chips.set(link.textContent ?? '', link.getAttribute('href') ?? '')
  }
  unmount()
  return chips
}

function mobileChips(rowId: string): Map<string, string> {
  const { unmount } = render(
    <MemoryRouter initialEntries={[`/algorithms?tab=support&protocol=${rowId}`]}>
      <MobileProtocolMatrixView />
    </MemoryRouter>
  )
  const sheet = screen.getByTestId('protocol-matrix-detail-sheet')
  const row = PROTOCOL_MATRIX.find((r) => r.id === rowId)!
  const chips = new Map<string, string>()
  for (const tool of row.playgrounds) {
    const href = resolveToolLink(tool)
    const link = within(sheet).getByRole('link', { name: toolLinkLabel(tool, href) })
    chips.set(link.textContent ?? '', link.getAttribute('href') ?? '')
  }
  unmount()
  return chips
}

describe('playground chips: laptop matrix and phone sheet share one destination helper', () => {
  it('some rows have a playground (the test is not vacuous)', () => {
    expect(withTools.length).toBeGreaterThan(10)
  })

  it.each(withTools.map((r) => [r.id]))('%s: every chip opens the same page on both', (rowId) => {
    const desktop = desktopChips(rowId)
    const mobile = mobileChips(rowId)
    expect([...mobile.entries()]).toEqual([...desktop.entries()])
    const row = PROTOCOL_MATRIX.find((r) => r.id === rowId)!
    for (const tool of row.playgrounds) {
      expect(mobile.get(toolLinkLabel(tool, resolveToolLink(tool)))).toBe(resolveToolLink(tool))
    }
  })

  it('a chip that opens a Learn module says so in its label and title, on the phone too', () => {
    const tool = PROTOCOL_MATRIX.flatMap((r) => r.playgrounds).find((t) =>
      resolveToolLink(t).startsWith('/learn/')
    )!
    expect(tool).toBeDefined()
    expect(toolLinkLabel(tool, resolveToolLink(tool))).toMatch(/\(Learn module\)$/)
    expect(toolLinkTitle(tool, resolveToolLink(tool))).toMatch(/^Opens the Learn module/)
  })

  it('an explicit per-cell url wins over the registry on both', () => {
    const row = PROTOCOL_MATRIX.find((r) => r.playgrounds.some((t) => t.url))!
    const tool = row.playgrounds.find((t) => t.url)!
    expect(resolveToolLink(tool)).toBe(tool.url)
    expect(mobileChips(row.id).get(toolLinkLabel(tool, tool.url!))).toBe(tool.url)
  })
})
