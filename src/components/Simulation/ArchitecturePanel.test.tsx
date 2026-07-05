// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ArchitecturePanel } from './ArchitecturePanel'
import { useSimulationStore } from '@/store/useSimulationStore'

// MermaidDiagram dynamically imports the real `mermaid` package and renders
// SVG via an effect — irrelevant to what we're testing here (that the
// Diagram view is handed a source string reflecting the player's progress).
// Mock it to capture the `source` prop directly instead of mocking `mermaid`.
vi.mock('./MermaidDiagram', () => ({
  MermaidDiagram: ({ source }: { source: string }) => (
    <div data-testid="mermaid-source">{source}</div>
  ),
}))

describe('ArchitecturePanel (interactive, two-gate)', () => {
  beforeEach(() => {
    useSimulationStore.setState({ edgeDecisions: {} })
  })

  it('migrating unlocked links raises readiness; "Migrate eligible" fills the unlocked capacity', () => {
    // p5Frac=1 unlocks all 3 migratable links (small org has 6 vulnerable, 3 migratable)
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    expect(screen.getByText(/0\/6 links migrated · 3\/3 unlocked via P5/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    expect(screen.getByText(/3\/6 links migrated/)).toBeInTheDocument()
  })

  it('the activity gate blocks migration until P5 work unlocks a link', () => {
    // no P5 progress → nothing unlocked → bulk + per-link migrate disabled
    render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
    expect(screen.getByText(/0\/6 links migrated · 0\/3 unlocked via P5/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Migrate eligible/i })).toBeDisabled()
    screen.getAllByRole('button', { name: /^Migrate$/i }).forEach((b) => expect(b).toBeDisabled())
  })

  it('only unlocks as many links as activities allow (floor of the fraction)', () => {
    // p5Frac≈0.5 of 3 migratable → floor = 1 unlocked
    render(<ArchitecturePanel size="small" country="US" p5Frac={0.5} />)
    expect(screen.getByText(/1\/3 unlocked via P5/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    // bulk migrate stops at the 1 unlocked link, not all 3
    expect(screen.getByText(/1\/6 links migrated/)).toBeInTheDocument()
  })

  it('a non-compliant strategy still migrates (no longer blocked) but is flagged', () => {
    // Germany (BSI) requires hybrid → "pure" is non-compliant, but migration is ALLOWED now
    render(<ArchitecturePanel size="small" country="DE" p5Frac={1} />)
    fireEvent.click(screen.getByRole('button', { name: /^pure$/i }))
    expect(screen.getByText(/requires hybrid/i)).toBeInTheDocument()
    const bulk = screen.getByRole('button', { name: /Migrate eligible/i })
    expect(bulk).not.toBeDisabled()
    fireEvent.click(bulk)
    expect(screen.getByText(/3\/6 links migrated/)).toBeInTheDocument()
  })

  it('the Diagram view reflects a migration made in List view, not just a static start state', () => {
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Diagram$/i }))
    expect(screen.getByTestId('mermaid-source').textContent).toContain('✓ migrated')
  })
})
