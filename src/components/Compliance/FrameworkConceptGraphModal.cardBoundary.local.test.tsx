// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The concept-graph modal is rendered inside a framework card, and React hands
 * a portal's events to the component that rendered it. Zooming the graph (a
 * double click, a zoom control, a click on the canvas) used to reach the
 * card's own click handler and open the framework detail panel behind the
 * graph, and that panel then took keyboard focus away from the relationship
 * list. These tests pin the boundary: click and wheel stay inside the modal,
 * while pointer-down and key events still reach the page.
 */
import { useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FocusLock from 'react-focus-lock'
import { MemoryRouter } from 'react-router'
import { Button } from '@/components/ui/button'
import type { XwalkGraph } from '@/utils/conceptXwalkGraph'
import { FrameworkConceptGraphModal } from './FrameworkConceptGraphModal'

const graph = vi.hoisted((): { value: XwalkGraph } => ({
  value: {
    nodes: [
      { id: 'a', label: 'Sample framework', sourceType: 'framework', isCenter: true },
      { id: 'b', label: 'Sample standard', sourceType: 'standard', isCenter: false },
    ],
    edges: [
      {
        id: 'subset',
        source: 'a',
        target: 'b',
        relationshipType: 'subset_of',
        rationaleType: 'semantic',
        evidence: 'Sample reference',
        confidenceScore: 60,
        isSynthetic: false,
      },
    ],
  },
}))
vi.mock('@/utils/conceptXwalkGraph', () => ({ buildConceptGraph: () => graph.value }))
vi.mock('@xyflow/react', () => ({
  MarkerType: { ArrowClosed: 'arrowclosed' },
  ReactFlow: ({ children }: { children: ReactNode }) => (
    <div data-testid="graph-canvas">{children}</div>
  ),
  Background: () => null,
  Controls: () => <Button type="button" aria-label="Zoom In" />,
  BaseEdge: () => null,
  EdgeLabelRenderer: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))
vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))

const REGION_NAME = 'Concept graph and relationship details'

/** A framework card: clicking anywhere on it opens the detail panel, as the
 *  real card does, and the graph modal is a React child of the card. */
function Card({
  onCardClick,
  onCardWheel,
  onClose = () => {},
}: {
  onCardClick: () => void
  onCardWheel?: () => void
  onClose?: () => void
}) {
  const [detailOpen, setDetailOpen] = useState(false)
  return (
    <MemoryRouter>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- test stand-in for the framework card, which keeps a redundant mouse click */}
      <div
        data-testid="card"
        onClick={() => {
          onCardClick()
          setDetailOpen(true)
        }}
        onWheel={onCardWheel}
      >
        <Button type="button">Card action</Button>
        <FrameworkConceptGraphModal
          isOpen
          onClose={onClose}
          centerConceptId="sample-a"
          title="Sample framework"
          frameworkId="sample-framework"
        />
        {detailOpen ? (
          <FocusLock returnFocus>
            <div role="dialog" aria-modal="true" aria-label="Sample framework detail">
              <Button type="button">Close detail</Button>
            </div>
          </FocusLock>
        ) : null}
      </div>
    </MemoryRouter>
  )
}

describe('graph modal keeps its events away from the card behind it', () => {
  it('still lets the card react to a click on the card itself (test setup check)', () => {
    const onCardClick = vi.fn()
    render(<Card onCardClick={onCardClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Card action' }))
    expect(onCardClick).toHaveBeenCalledOnce()
  })

  it('does not pass a click on the canvas, the header or the zoom control to the card', () => {
    const onCardClick = vi.fn()
    render(<Card onCardClick={onCardClick} />)
    const dialog = screen.getByRole('dialog', { name: 'Sample framework' })
    fireEvent.click(within(dialog).getByTestId('graph-canvas'))
    fireEvent.doubleClick(within(dialog).getByTestId('graph-canvas'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Zoom In' }))
    fireEvent.click(within(dialog).getByRole('heading', { name: 'Sample framework' }))
    fireEvent.click(dialog)
    expect(onCardClick).not.toHaveBeenCalled()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('closes from the Close button and the backdrop without opening the card detail', () => {
    const onCardClick = vi.fn()
    const onClose = vi.fn()
    render(<Card onCardClick={onCardClick} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close concept graph' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    // eslint-disable-next-line testing-library/no-node-access -- the backdrop is an aria-hidden layer with no role or text to query
    const backdrop = document.body.querySelector('[aria-hidden="true"].bg-black\\/60')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop as Element)
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onCardClick).not.toHaveBeenCalled()
  })

  it('does not pass a wheel or pinch-zoom event on the canvas to the card', () => {
    const onCardWheel = vi.fn()
    render(<Card onCardClick={() => {}} onCardWheel={onCardWheel} />)
    fireEvent.wheel(screen.getByRole('button', { name: 'Card action' }), { deltaY: -120 })
    expect(onCardWheel).toHaveBeenCalledTimes(1)
    const canvas = screen.getByTestId('graph-canvas')
    fireEvent.wheel(canvas, { deltaY: -120 })
    fireEvent.wheel(canvas, { deltaY: -120, ctrlKey: true })
    expect(onCardWheel).toHaveBeenCalledTimes(1)
  })

  it('leaves pointer-down and key events visible to the page', () => {
    const onDocumentMouseDown = vi.fn()
    const onDocumentKeyDown = vi.fn()
    document.addEventListener('mousedown', onDocumentMouseDown)
    document.addEventListener('keydown', onDocumentKeyDown)
    try {
      render(<Card onCardClick={() => {}} />)
      const canvas = screen.getByTestId('graph-canvas')
      fireEvent.mouseDown(canvas)
      fireEvent.keyDown(canvas, { key: 'ArrowDown' })
      expect(onDocumentMouseDown).toHaveBeenCalledTimes(1)
      expect(onDocumentKeyDown).toHaveBeenCalledTimes(1)
    } finally {
      document.removeEventListener('mousedown', onDocumentMouseDown)
      document.removeEventListener('keydown', onDocumentKeyDown)
    }
  })
})

describe('keyboard focus stays on the labelled relationship region after graph clicks', () => {
  it('keeps one dialog and leaves focus on the scroll region after clicking the canvas', async () => {
    const user = userEvent.setup()
    const onCardClick = vi.fn()
    render(<Card onCardClick={onCardClick} />)
    const region = screen.getByRole('region', { name: REGION_NAME })
    expect(region).toHaveAttribute('tabindex', '0')
    await user.click(screen.getByTestId('graph-canvas'))
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(region).toHaveFocus()
    expect(onCardClick).not.toHaveBeenCalled()
    // Keys typed now go to the region that scrolls the relationship list.
    await user.keyboard('{PageDown}')
    expect(region).toHaveFocus()
  })

  it('keeps focus inside the graph dialog after a double click and a zoom control click', async () => {
    const user = userEvent.setup()
    render(<Card onCardClick={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Sample framework' })
    await user.dblClick(screen.getByTestId('graph-canvas'))
    await user.click(within(dialog).getByRole('button', { name: 'Zoom In' }))
    expect(screen.queryByRole('dialog', { name: 'Sample framework detail' })).toBeNull()
    // eslint-disable-next-line testing-library/no-node-access -- focus location is the thing under test
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
