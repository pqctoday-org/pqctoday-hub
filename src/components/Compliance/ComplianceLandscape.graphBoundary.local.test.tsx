// SPDX-License-Identifier: AGPL-3.0-only
/**
 * On the framework card, the concept graph opens in a modal that React treats
 * as a child of the card. Zooming the graph must not also open the framework
 * detail panel behind it: the card's click convenience is for clicks on the
 * card, not on the graph.
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { ComplianceLandscape } from './ComplianceLandscape'
import { complianceFrameworks, conceptIdForFramework } from '@/data/complianceData'
import { hasGraphEdges } from '@/utils/conceptXwalkGraph'

vi.mock('./FrameworkConceptGraph', () => ({
  FrameworkConceptGraph: () => (
    <div data-testid="graph-canvas">
      <Button type="button" aria-label="Zoom In" />
    </div>
  ),
}))
vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))

const withGraph = complianceFrameworks.find((fw) => {
  const id = conceptIdForFramework(fw)
  return id !== undefined && hasGraphEdges(id)
})

function renderCard(onSelectFramework: () => void) {
  expect(withGraph).toBeDefined()
  render(
    <MemoryRouter>
      <ComplianceLandscape frameworks={[withGraph!]} onSelectFramework={onSelectFramework} />
    </MemoryRouter>
  )
}

describe('framework card with the concept graph open', () => {
  it('opens the detail panel from the card name (test setup check)', () => {
    const onSelectFramework = vi.fn()
    renderCard(onSelectFramework)
    fireEvent.click(screen.getByRole('button', { name: `View details for ${withGraph!.label}` }))
    expect(onSelectFramework).toHaveBeenCalledWith(expect.objectContaining({ id: withGraph!.id }))
  })

  it('opening the graph, zooming it and closing it never opens the detail panel', () => {
    const onSelectFramework = vi.fn()
    renderCard(onSelectFramework)
    const label = withGraph!.label
    fireEvent.click(screen.getByRole('button', { name: `Open concept graph for ${label}` }))
    const dialog = screen.getByRole('dialog', { name: label })
    fireEvent.click(within(dialog).getByTestId('graph-canvas'))
    fireEvent.doubleClick(within(dialog).getByTestId('graph-canvas'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Zoom In' }))
    fireEvent.wheel(within(dialog).getByTestId('graph-canvas'), { deltaY: -120, ctrlKey: true })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close concept graph' }))
    expect(onSelectFramework).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
