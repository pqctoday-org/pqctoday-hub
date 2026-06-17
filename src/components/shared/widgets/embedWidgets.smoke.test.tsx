// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render smoke tests for the simulation embed widgets (C5 slice / C6 / C7).
 *
 * The embed CONTRACT is covered by `Simulation/embedContract.test.ts`
 * (canEmbedStep / isStepComplete). That proves a step is *classified* as
 * embeddable — it does NOT prove the widget actually MOUNTS. These tests close
 * that gap: each widget is rendered in jsdom and asserted to produce its real
 * content without throwing, so a mount-time crash (bad import, store misuse,
 * router assumption) can't ship green.
 *
 * MigrateEmbed / ProtocolMatrixEmbed self-wrap in a MemoryRouter; TimelineEmbed
 * needs no router (SimpleGanttChart uses no router Links). The heavy MigrateView
 * pulls in semantic search — mocked to idle so the test stays a pure render check.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// MigrateView (wrapped by MigrateEmbed) calls useSemanticSearch — keep it idle.
vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))

import { TimelineEmbed } from './TimelineEmbed'
import { ProtocolMatrixEmbed } from './ProtocolMatrixEmbed'
import { MigrateEmbed } from './MigrateEmbed'

describe('embed widgets — render smoke tests', () => {
  it('C6: TimelineEmbed mounts and shows its scope label', () => {
    render(<TimelineEmbed scope={{ country: 'United States' }} />)
    // The embedded Gantt renders a scope chip instead of the filter toolbar.
    expect(screen.getByText(/PQC migration timeline/i)).toBeInTheDocument()
  })

  it('C6: TimelineEmbed mounts with an empty scope (global, no crash)', () => {
    const { container } = render(<TimelineEmbed scope={{}} />)
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByText(/Global PQC migration timeline/i)).toBeInTheDocument()
  })

  it('C5 slice: ProtocolMatrixEmbed mounts the Protocol Support matrix', () => {
    render(<ProtocolMatrixEmbed />)
    expect(screen.getByText(/PQC Protocol Support Matrix/i)).toBeInTheDocument()
  })

  it('C7: MigrateEmbed mounts the catalog headless (no PageHeader crash)', () => {
    const { container } = render(<MigrateEmbed />)
    // simEmbed hides the PageHeader; the catalog body still renders.
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByPlaceholderText(/Search software/i)).toBeInTheDocument()
  })
})
