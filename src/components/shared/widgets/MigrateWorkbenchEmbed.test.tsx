// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MigrateWorkbenchEmbed } from './MigrateWorkbenchEmbed'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

// The embed's job is choosing the right focus for the real workbench — mock the
// (heavy) workbench itself and assert what it gets handed.
vi.mock('@/components/Migrate/Workbench/MigrationWorkbench', () => ({
  MigrationWorkbench: ({ embedded, focus }: { embedded?: boolean; focus?: { tab?: string } }) => (
    <div data-testid="wb" data-embedded={String(embedded)} data-tab={focus?.tab ?? 'none'} />
  ),
}))

beforeEach(() => {
  useMigrateSelectionStore.setState({ plan: [], choice: {} })
})

describe('MigrateWorkbenchEmbed', () => {
  it('opens pilots on the Replace tab when the player has no migration plan yet', () => {
    render(<MigrateWorkbenchEmbed catalogId="pilots" />)
    expect(screen.getByTestId('wb')).toHaveAttribute('data-tab', 'replace')
  })

  it("opens pilots on the Plan tab when the player's real /migrate plan has assets (H1)", () => {
    useMigrateSelectionStore.setState({ plan: ['tls-termination'] })
    render(<MigrateWorkbenchEmbed catalogId="pilots" />)
    expect(screen.getByTestId('wb')).toHaveAttribute('data-tab', 'plan')
  })

  it('keeps discovery on the Replace tab regardless of the plan (deliberate — tooling catalog)', () => {
    useMigrateSelectionStore.setState({ plan: ['tls-termination'] })
    render(<MigrateWorkbenchEmbed catalogId="discovery" />)
    expect(screen.getByTestId('wb')).toHaveAttribute('data-tab', 'replace')
  })

  it('always renders the workbench in embedded mode', () => {
    render(<MigrateWorkbenchEmbed catalogId="pilots" />)
    expect(screen.getByTestId('wb')).toHaveAttribute('data-embedded', 'true')
  })
})
