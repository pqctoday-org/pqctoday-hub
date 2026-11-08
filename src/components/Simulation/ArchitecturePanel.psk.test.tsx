// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchitecturePanel } from './ArchitecturePanel'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

vi.mock('./MermaidDiagram', () => ({
  MermaidDiagram: ({ source }: { source: string }) => (
    <div data-testid="mermaid-source">{source}</div>
  ),
}))

// The catalogue holds no pre-shared-key-only product under this name, so the
// status is supplied here; every other lookup uses the real catalogue.
vi.mock('@/data/catalogStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/catalogStatus')>()
  return {
    ...actual,
    getCatalogStatus: (name: string) =>
      name === 'OpenSSL'
        ? { canonical: 'psk', availability: 'psk' as const }
        : actual.getCatalogStatus(name),
  }
})

describe('ArchitecturePanel selection chips for a pre-shared-key-only product', () => {
  beforeEach(() => {
    useSimulationStore.setState({ edgeDecisions: {} })
    useMigrateSelectionStore.setState({ myProducts: ['openssl'], choice: {} })
  })

  it('reads "Pre-shared key only" in the tooltip and uses the info colour', () => {
    render(<ArchitecturePanel size="small" country="US" p5Frac={0} />)
    const chip = screen.getByText('OpenSSL')
    expect(chip).toHaveAttribute('title', 'Pre-shared key only')
    expect(chip.className).toContain('text-status-info')
  })
})
