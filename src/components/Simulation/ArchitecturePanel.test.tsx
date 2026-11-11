// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ArchitecturePanel } from './ArchitecturePanel'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { ARCHITECTURES } from '@/data/simArchitecture'
import { planningForArchitecture } from '@/simulation/edgePlanningProgress'
import { computeReadiness } from '@/simulation/readiness'

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
    useMigrateSelectionStore.setState({ myProducts: [], choice: {} })
  })

  it('migrating unlocked links raises readiness; "Migrate eligible" fills the unlocked capacity', () => {
    // p5Frac=1 unlocks all 3 migratable links (small org has 6 vulnerable, 3 migratable)
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    expect(
      screen.getByText(/0\/6 links planned · 0 eligible choices · 3\/3 unlocked via P5/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    expect(screen.getByText(/3\/6 links planned/)).toBeInTheDocument()
  })

  it('the activity gate blocks migration until P5 work unlocks a link', () => {
    // no P5 progress → nothing unlocked → bulk + per-link migrate disabled
    render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
    expect(
      screen.getByText(/0\/6 links planned · 0 eligible choices · 0\/3 unlocked via P5/)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Migrate eligible/i })).toBeDisabled()
    screen.getAllByRole('button', { name: /^Migrate$/i }).forEach((b) => expect(b).toBeDisabled())
  })

  it('only unlocks as many links as activities allow (floor of the fraction)', () => {
    // p5Frac≈0.5 of 3 migratable → floor = 1 unlocked
    render(<ArchitecturePanel size="small" country="US" p5Frac={0.5} />)
    expect(screen.getByText(/1\/3 unlocked via P5/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    // bulk migrate stops at the 1 unlocked link, not all 3
    expect(screen.getByText(/1\/6 links planned/)).toBeInTheDocument()
  })

  it('a non-compliant strategy still migrates (no longer blocked) but is flagged', () => {
    // Germany (BSI guidance) expects hybrid → "pure" departs from it, but migration is ALLOWED now
    render(<ArchitecturePanel size="small" country="DE" p5Frac={1} />)
    fireEvent.click(screen.getByRole('button', { name: /^pure$/i }))
    expect(screen.getByText(/expects hybrid in its published guidance/i)).toBeInTheDocument()
    expect(screen.queryByText(/requires hybrid/i)).not.toBeInTheDocument()
    const bulk = screen.getByRole('button', { name: /Migrate eligible/i })
    expect(bulk).not.toBeDisabled()
    fireEvent.click(bulk)
    expect(screen.getByText(/3\/6 links planned/)).toBeInTheDocument()
  })

  it('the Diagram view reflects a migration made in List view, not just a static start state', () => {
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Diagram$/i }))
    expect(screen.getByTestId('mermaid-source').textContent).toContain('✓ migrated')
  })

  it('withdraws all green credit after effort loss, preserves choices, and restores exactly the named Undo remainder', () => {
    const { rerender } = render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    const original = { ...useSimulationStore.getState().edgeDecisions }
    expect(Object.keys(original).sort()).toEqual([
      'admin-vpn-IKEv2',
      'cdn-app-TLS',
      'user-cdn-TLS 1.3',
    ])
    fireEvent.click(screen.getByRole('button', { name: /^Diagram$/i }))
    expect(screen.getByTestId('mermaid-source').textContent?.match(/✓ migrated/g)).toHaveLength(3)

    rerender(<ArchitecturePanel size="small" country="US" p5Frac={0.5} />)
    expect(screen.getByTestId('arch-overcapacity')).toBeInTheDocument()
    expect(
      screen.getByText(/0\/6 links planned · 3 eligible choices · 1\/3 unlocked/)
    ).toBeInTheDocument()
    expect(screen.getByTestId('mermaid-source').textContent).not.toContain('✓ migrated')
    expect(screen.getByTestId('mermaid-source').textContent).not.toMatch(/^\s*linkStyle /m)
    expect(useSimulationStore.getState().edgeDecisions).toEqual(original)

    fireEvent.click(screen.getByRole('button', { name: /^List$/i }))
    expect(screen.getAllByText('Saved hybrid')).toHaveLength(3)
    for (const row of screen.getAllByRole('listitem')) {
      expect(row.querySelector('.text-status-success')).toBeNull()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Undo migration of User to Caddy Web/LB' }))
    expect(screen.getByTestId('arch-overcapacity')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Undo migration of Caddy Web/LB to App Server' })
    )
    expect(screen.queryByTestId('arch-overcapacity')).not.toBeInTheDocument()
    expect(useSimulationStore.getState().edgeDecisions).toEqual({ 'admin-vpn-IKEv2': 'hybrid' })
    const remaining = planningForArchitecture(
      ARCHITECTURES.small,
      0.5,
      useSimulationStore.getState().edgeDecisions
    )
    expect(remaining.creditedKeys).toEqual(['admin-vpn-IKEv2'])
    expect(remaining.groups['hndl-critical'].completedKeys).toEqual(['admin-vpn-IKEv2'])
    expect(remaining.groups['hndl-general'].completedKeys).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: /^Diagram$/i }))
    const diagram = screen.getByTestId('mermaid-source').textContent!
    expect(diagram.match(/✓ migrated/g)).toHaveLength(1)
    expect(diagram).toContain('admin -->|"IKEv2 ✓ migrated"| vpn')
    expect(diagram).not.toContain('TLS 1.3 ✓ migrated')
    expect(diagram).not.toContain('TLS ✓ migrated')
  })

  it('keeps unavailable and unknown historical choices removable without deleting other saved choices', () => {
    useSimulationStore.setState({
      edgeDecisions: {
        'app-db-TLS (wire)': 'hybrid',
        'outside-this-case': 'pure',
        'admin-vpn-IKEv2': 'hybrid',
      },
    })
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    expect(screen.getByText(/1\/6 links planned · 1 eligible choices/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo migration of App Server to MongoDB' }))
    expect(useSimulationStore.getState().edgeDecisions).toEqual({
      'outside-this-case': 'pure',
      'admin-vpn-IKEv2': 'hybrid',
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove saved choice for unknown link outside-this-case' })
    )
    expect(useSimulationStore.getState().edgeDecisions).toEqual({ 'admin-vpn-IKEv2': 'hybrid' })
    expect(screen.queryByText('outside-this-case')).not.toBeInTheDocument()
    expect(
      planningForArchitecture(ARCHITECTURES.small, 1, useSimulationStore.getState().edgeDecisions)
        .creditedKeys
    ).toEqual(['admin-vpn-IKEv2'])
  })

  it('does not credit a malformed choice and lets the learner undo it and choose a valid strategy', () => {
    useSimulationStore.setState({ edgeDecisions: { 'admin-vpn-IKEv2': 'invalid' as 'hybrid' } })
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    expect(screen.getByText(/0\/6 links planned · 0 eligible choices/)).toBeInTheDocument()
    expect(screen.getByText('Saved invalid choice')).toBeInTheDocument()
    const undo = screen.getByRole('button', { name: 'Undo migration of Admin to strongSwan VPN' })
    const row = undo.closest('li')!
    expect(row.querySelector('.text-status-success')).toBeNull()
    fireEvent.click(undo)
    expect(useSimulationStore.getState().edgeDecisions).toEqual({})
    fireEvent.click(within(row).getByRole('button', { name: /^Migrate$/ }))
    expect(useSimulationStore.getState().edgeDecisions).toEqual({ 'admin-vpn-IKEv2': 'hybrid' })
    expect(
      computeReadiness('small', 1, useSimulationStore.getState().edgeDecisions, 'US').migrated
    ).toBe(1)
    expect(within(row).getByText('✓ hybrid')).toHaveClass('text-status-success')
  })

  it('gives the same headline count but different purpose progress for actual general versus critical UI selections', () => {
    render(<ArchitecturePanel size="small" country="US" p5Frac={1} />)
    const generalRow = screen
      .getAllByRole('listitem')
      .find((row) => row.textContent?.includes('—TLS 1.3→'))!
    fireEvent.click(within(generalRow).getByRole('button', { name: /^Migrate$/ }))
    const general = computeReadiness('small', 1, useSimulationStore.getState().edgeDecisions, 'US')
    expect(general.planning.creditedKeys).toEqual(['user-cdn-TLS 1.3'])
    fireEvent.click(within(generalRow).getByRole('button', { name: /Undo migration/ }))
    const criticalRow = screen
      .getAllByRole('listitem')
      .find((row) => row.textContent?.includes('—IKEv2→'))!
    fireEvent.click(within(criticalRow).getByRole('button', { name: /^Migrate$/ }))
    const critical = computeReadiness('small', 1, useSimulationStore.getState().edgeDecisions, 'US')
    expect(critical.planning.creditedKeys).toEqual(['admin-vpn-IKEv2'])
    expect(critical.pct).toBe(general.pct)
    expect(general.planning.groups['hndl-critical'].progress).toBe(0)
    expect(critical.planning.groups['hndl-critical'].progress).toBe(0.5)
    expect(general.planning.groups['tnfl-general'].progress).toBe(1)
    expect(critical.planning.groups['tnfl-general'].progress).toBe(0)
  })

  // WP5.4 — "your selection" chips (display-only, no effect on edgeState/gating).
  describe('real /migrate selection', () => {
    it('shows nothing when the player has made no real selection', () => {
      render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
      expect(screen.queryByText(/Your selection/i)).not.toBeInTheDocument()
    })

    it('shows a chip per selected product, with its real catalog PQC status', () => {
      useMigrateSelectionStore.setState({ myProducts: ['openssl'] })
      render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
      expect(screen.getByText(/Your selection/i)).toBeInTheDocument()
      const chip = screen.getByText('OpenSSL')
      expect(chip).toBeInTheDocument()
      expect(chip).toHaveAttribute('title', 'PQC available')
    })

    it('does not change unlock/migration gating — display layer only', () => {
      useMigrateSelectionStore.setState({ myProducts: ['openssl'] })
      render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
      expect(
        screen.getByText(/0\/6 links planned · 0 eligible choices · 0\/3 unlocked via P5/)
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Migrate eligible/i })).toBeDisabled()
    })
  })
})
