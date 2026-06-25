// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the Tabs primitive (M8) — a custom (non-Radix) context-driven
 * implementation used across many pages. Pins the controlled/uncontrolled
 * switching, active-state marking, and content gating.
 */
import { type ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.getByText('Details panel')).toBeInTheDocument()
    expect(screen.queryByText('Overview panel')).not.toBeInTheDocument()
  })

  it('marks the active trigger with data-state="active"', () => {
    renderTabs({ defaultValue: 'overview' })
    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'data-state',
      'inactive'
    )
  })

  it('derives a stable workshop-target slug from the tab value', () => {
    render(
      <Tabs defaultValue="a">
        <TabsTrigger value="My Tab">My Tab</TabsTrigger>
      </Tabs>
    )
    expect(screen.getByRole('button', { name: 'My Tab' })).toHaveAttribute(
      'data-workshop-target',
      'tab-my-tab'
    )
  })

  it('controlled mode: calls onValueChange but does not self-switch', () => {
    const onValueChange = vi.fn()
    renderTabs({ value: 'overview', onValueChange })
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
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
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByText('B panel')).toBeInTheDocument()
  })
})
