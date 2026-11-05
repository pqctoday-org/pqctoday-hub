// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Button } from './button'
const load = vi.hoisted(() => vi.fn())
vi.mock('../../data/glossary', () => ({ loadGlossary: load }))
const terms = ['Alpha', 'Beta', 'Gamma'].map((term) => ({
  term,
  acronym: term[0],
  definition: `${term} definition`,
  relatedModule: `/learn/${term.toLowerCase()}`,
}))
let InlineTooltip: typeof import('./InlineTooltip').InlineTooltip
beforeEach(async () => {
  vi.resetModules()
  load.mockReset()
  InlineTooltip = (await import('./InlineTooltip')).InlineTooltip
})
it('notifies every cold mount from one pending lookup; warm and unknown terms retain meaning', async () => {
  let resolve!: (value: typeof terms) => void
  load.mockReturnValue(
    new Promise((done) => {
      resolve = done
    })
  )
  const view = render(
    <MemoryRouter>
      <InlineTooltip term="A" />
      <InlineTooltip term="Beta" />
      <InlineTooltip term="Gamma" />
      <InlineTooltip term="unknown" />
    </MemoryRouter>
  )
  expect(load).toHaveBeenCalledTimes(1)
  expect(screen.queryAllByRole('button')).toHaveLength(0)
  await act(async () => resolve(terms))
  expect(screen.getAllByRole('button')).toHaveLength(3)
  view.rerender(
    <MemoryRouter>
      <InlineTooltip term="alpha" />
      <InlineTooltip term="unknown" />
    </MemoryRouter>
  )
  expect(screen.getByRole('button', { name: 'Definition of Alpha' })).toHaveTextContent('alpha')
  expect(screen.getByText('unknown')).toBeVisible()
  expect(load).toHaveBeenCalledTimes(1)
})
it('a rejected lookup is retryable and wakes earlier mounted subscribers without updating an unmounted term', async () => {
  load.mockRejectedValueOnce(new Error('sample unavailable')).mockResolvedValueOnce(terms)
  render(
    <MemoryRouter>
      <InlineTooltip term="Alpha" />
    </MemoryRouter>
  )
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
  await act(async () => {
    await Promise.resolve()
  })
  const view = render(
    <MemoryRouter>
      <InlineTooltip term="Beta" />
    </MemoryRouter>
  )
  await screen.findByRole('button', { name: 'Definition of Beta' })
  expect(screen.getByRole('button', { name: 'Definition of Alpha' })).toBeVisible()
  view.unmount()
  expect(load).toHaveBeenCalledTimes(2)
})
it('keeps pointer handoff and first activation open, preserves destination, dismisses outside', async () => {
  load.mockResolvedValue(terms)
  render(
    <MemoryRouter>
      <InlineTooltip term="Alpha" />
      <Button>Outside</Button>
    </MemoryRouter>
  )
  const trigger = await screen.findByRole('button', { name: 'Definition of Alpha' })
  fireEvent.mouseEnter(trigger)
  fireEvent.mouseLeave(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Definition of Alpha' })
  fireEvent.mouseEnter(dialog)
  await new Promise((resolve) => setTimeout(resolve, 220))
  expect(dialog).toBeVisible()
  expect(screen.getByRole('link', { name: 'Learn more →' })).toHaveAttribute('href', '/learn/alpha')
  fireEvent.focus(trigger)
  fireEvent.click(trigger)
  expect(dialog).toBeVisible()
  fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('provides portal keyboard traversal, scroll-safe focus, Escape return without reopening and normal continuation', async () => {
  load.mockResolvedValue(terms)
  render(
    <MemoryRouter>
      <InlineTooltip term="Alpha" />
      <Button>After</Button>
    </MemoryRouter>
  )
  const trigger = await screen.findByRole('button', { name: 'Definition of Alpha' })
  const after = screen.getByRole('button', { name: 'After' })
  vi.spyOn(trigger, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  vi.spyOn(after, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  act(() => trigger.focus())
  fireEvent.scroll(window)
  expect(screen.getByRole('dialog')).toBeVisible()
  fireEvent.keyDown(trigger, { key: 'Tab' })
  expect(screen.getByRole('link')).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('link'), { key: 'Tab', shiftKey: true })
  expect(trigger).toHaveFocus()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(trigger)
  fireEvent.keyDown(trigger, { key: 'Tab' })
  const outerEscape = vi.fn()
  window.addEventListener('keydown', outerEscape)
  fireEvent.keyDown(screen.getByRole('link'), { key: 'Escape' })
  window.removeEventListener('keydown', outerEscape)
  expect(outerEscape).not.toHaveBeenCalled()
  expect(trigger).toHaveFocus()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(trigger)
  fireEvent.keyDown(trigger, { key: 'Tab' })
  fireEvent.keyDown(screen.getByRole('link'), { key: 'Tab' })
  expect(after).toHaveFocus()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('closes the definition before an existing page overlay and removes pending unmounted subscribers', async () => {
  const { useOverlayEscape } = await import('@/hooks/useOverlayEscape')
  const lowerClose = vi.fn()
  function LowerOverlay() {
    useOverlayEscape(true, lowerClose)
    return <Button>Underlying overlay control</Button>
  }
  let resolve!: (value: typeof terms) => void
  load.mockReturnValue(
    new Promise((done) => {
      resolve = done
    })
  )
  const { unmount } = render(
    <MemoryRouter>
      <InlineTooltip term="Gamma" />
    </MemoryRouter>
  )
  unmount()
  render(
    <MemoryRouter>
      <LowerOverlay />
      <InlineTooltip term="Alpha" />
    </MemoryRouter>
  )
  await act(async () => resolve(terms))
  const trigger = screen.getByRole('button', { name: 'Definition of Alpha' })
  act(() => trigger.focus())
  fireEvent.keyDown(trigger, { key: 'Tab' })
  fireEvent.keyDown(screen.getByRole('link'), { key: 'Escape' })
  expect(trigger).toHaveFocus()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(lowerClose).not.toHaveBeenCalled()
  fireEvent.keyDown(screen.getByRole('button', { name: 'Underlying overlay control' }), {
    key: 'Escape',
  })
  expect(lowerClose).toHaveBeenCalledTimes(1)
  expect(load).toHaveBeenCalledTimes(1)
})
