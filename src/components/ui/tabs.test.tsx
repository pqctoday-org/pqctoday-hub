// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the Tabs primitive (M8) — a custom (non-Radix) context-driven
 * implementation used across many pages. Pins the controlled/uncontrolled
 * switching, active-state marking, and content gating.
 */
import { type ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

function renderTabs(props: ComponentProps<typeof Tabs> = {}) {
  return render(
    <Tabs {...props}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="details">Details panel</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('renders only the active tab content (uncontrolled defaultValue)', () => {
    renderTabs({ defaultValue: 'overview' })
    expect(screen.getByText('Overview panel')).toBeInTheDocument()
    expect(screen.queryByText('Details panel')).not.toBeInTheDocument()
  })

  it('switches content when another trigger is clicked (uncontrolled)', () => {
    renderTabs({ defaultValue: 'overview' })
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
    expect(screen.getByText('Details panel')).toBeInTheDocument()
    expect(screen.queryByText('Overview panel')).not.toBeInTheDocument()
  })

  it('marks the active trigger with data-state="active"', () => {
    renderTabs({ defaultValue: 'overview' })
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('data-state', 'inactive')
  })

  it('derives a stable workshop-target slug from the tab value', () => {
    render(
      <Tabs defaultValue="a">
        <TabsTrigger value="My Tab">My Tab</TabsTrigger>
      </Tabs>
    )
    expect(screen.getByRole('tab', { name: 'My Tab' })).toHaveAttribute(
      'data-workshop-target',
      'tab-my-tab'
    )
  })

  it('controlled mode: calls onValueChange but does not self-switch', () => {
    const onValueChange = vi.fn()
    renderTabs({ value: 'overview', onValueChange })
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
    expect(onValueChange).toHaveBeenCalledWith('details')
    // value is controlled and unchanged → content stays on overview
    expect(screen.getByText('Overview panel')).toBeInTheDocument()
    expect(screen.queryByText('Details panel')).not.toBeInTheDocument()
  })

  it('still fires a trigger’s own onClick alongside the tab change', () => {
    const onClick = vi.fn()
    render(
      <Tabs defaultValue="a">
        <TabsTrigger value="b" onClick={onClick}>
          Go
        </TabsTrigger>
        <TabsContent value="b">B panel</TabsContent>
      </Tabs>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByText('B panel')).toBeInTheDocument()
  })
  // ---- WS7: WAI-ARIA tab pattern ----

  it('exposes tablist / tab / tabpanel roles', () => {
    renderTabs({ defaultValue: 'overview' })
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview panel')
  })

  it('wires aria-selected, aria-controls and aria-labelledby to matching ids', () => {
    renderTabs({ defaultValue: 'overview' })
    const active = screen.getByRole('tab', { name: 'Overview' })
    const inactive = screen.getByRole('tab', { name: 'Details' })
    const panel = screen.getByRole('tabpanel')
    expect(active).toHaveAttribute('aria-selected', 'true')
    expect(inactive).toHaveAttribute('aria-selected', 'false')
    expect(active.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(active.id)
    // Inactive panels are unmounted, so the inactive tab points at nothing —
    // aria-selected="false" is what keeps that valid.
    expect(inactive).not.toHaveAttribute('aria-controls')
  })

  it('gives the selected tab the only tab stop (roving tabindex)', () => {
    renderTabs({ defaultValue: 'overview' })
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('tabindex', '-1')
  })

  it('ArrowRight / ArrowLeft / Home / End move focus and selection', async () => {
    renderTabs({ defaultValue: 'overview' })
    const overview = screen.getByRole('tab', { name: 'Overview' })
    overview.focus()
    await userEvent.keyboard('{ArrowRight}')
    const details = screen.getByRole('tab', { name: 'Details' })
    expect(document.activeElement).toBe(details)
    expect(details).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Overview' }))
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Details' }))
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Overview' }))
  })

  it('namespaces ids per Tabs instance so two tab bars never collide', () => {
    render(
      <div>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">A</TabsContent>
        </Tabs>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">B</TabsContent>
        </Tabs>
      </div>
    )
    const ids = screen.getAllByRole('tab', { name: 'Overview' }).map((el) => el.id)
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
    expect(ids.every(Boolean)).toBe(true)
  })
})
