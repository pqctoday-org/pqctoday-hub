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
import type { ReactElement } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'

// MigrateView (wrapped by MigrateEmbed) calls useSemanticSearch — keep it idle.
vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))

import { TimelineEmbed } from './TimelineEmbed'
import { ProtocolMatrixEmbed } from './ProtocolMatrixEmbed'
import { MigrateEmbed } from './MigrateEmbed'

/**
 * CRITICAL: render inside an OUTER router. In the real app every embed mounts
 * inside the sim, which is itself inside the app's <BrowserRouter>. An earlier
 * version of these widgets wrapped their content in their OWN <MemoryRouter>,
 * which threw "You cannot render a <Router> inside another <Router>" at runtime
 * — but the first cut of this test rendered the widgets with NO outer router, so
 * the nested router was the only one and the bug slipped through. Rendering under
 * an outer MemoryRouter reproduces the real condition and would catch a re-nest.
 */
const renderEmbedded = (ui: ReactElement) =>
  render(<MemoryRouter initialEntries={['/simulation']}>{ui}</MemoryRouter>)

describe('embed widgets — render smoke tests (inside an outer router)', () => {
  it('C6: TimelineEmbed mounts and shows its scope label', () => {
    renderEmbedded(<TimelineEmbed scope={{ country: 'United States' }} />)
    // The embedded Gantt renders a scope chip instead of the filter toolbar.
    expect(screen.getByText(/PQC migration timeline/i)).toBeInTheDocument()
  })

  it('C6: TimelineEmbed mounts with an empty scope (global, no crash)', () => {
    const { container } = renderEmbedded(<TimelineEmbed scope={{}} />)
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByText(/Global PQC migration timeline/i)).toBeInTheDocument()
  })

  it('C5 slice: ProtocolMatrixEmbed mounts the Protocol Support matrix', () => {
    renderEmbedded(<ProtocolMatrixEmbed />)
    expect(screen.getByText(/PQC Protocol Support Matrix/i)).toBeInTheDocument()
  })

  it('C7: MigrateEmbed mounts the catalog headless (no nested-router / PageHeader crash)', () => {
    const { container } = renderEmbedded(<MigrateEmbed />)
    // simEmbed hides the PageHeader; the catalog body still renders.
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByPlaceholderText(/Search software/i)).toBeInTheDocument()
  })
})
