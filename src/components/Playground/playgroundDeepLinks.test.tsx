// SPDX-License-Identifier: AGPL-3.0-only
// Crypto Lab deep links and pickers: ?tool= forwarding, ?step= reaching the
// tool, the ⌘K palette's nickname search and full playgrounds, and the phone
// Crypto Lab tab opening a tool's own page.
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { PlaygroundWorkshop } from './PlaygroundWorkshop'
import { PlaygroundToolRoute } from './PlaygroundToolRoute'
import { CommandPalette } from './CommandPalette'
import { WorkshopToolsTab } from './tabs/WorkshopToolsTab'
import { WORKSHOP_TOOLS, TOOL_COMPONENTS } from './workshopRegistry'
import { DROPPED_TOOL_IDS } from '@/components/Mobile/screens/MobilePlaygroundView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useSandboxStore } from '@/store/useSandboxStore'

/** Prints where the router ended up, so a redirect can be asserted. */
function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{`${pathname}${search}`}</p>
}

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null })
  useBookmarkStore.setState({ myPlaygroundTools: [], showOnlyPlaygroundTools: false })
  useSandboxStore.setState({ status: 'offline', lastChecked: 1, error: 'stub', baseUrl: '' })
})

describe('/playground?tool=<id>', () => {
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/playground" element={<PlaygroundWorkshop />} />
          <Route path="/playground/:toolId" element={<Where />} />
        </Routes>
      </MemoryRouter>
    )

  it('forwards a known tool to its own page and keeps the other parameters', async () => {
    renderAt('/playground?tool=tls-simulator&step=2')
    expect(await screen.findByTestId('where')).toHaveTextContent('/playground/tls-simulator?step=2')
  })

  it('stays on the catalog for an unknown tool id', () => {
    renderAt('/playground?tool=no-such-tool')
    expect(screen.queryByTestId('where')).not.toBeInTheDocument()
    expect(screen.getByText('Crypto Lab')).toBeInTheDocument()
  })
})

describe('/playground/<id>?step=N', () => {
  it('passes a valid step to the tool and ignores a malformed one', async () => {
    const seen: (number | undefined)[] = []
    function Probe({ initialStep }: { initialStep?: number }) {
      seen.push(initialStep)
      return <p>probe step {String(initialStep)}</p>
    }
    const original = TOOL_COMPONENTS['merkle-proof']
    TOOL_COMPONENTS['merkle-proof'] = React.lazy(async () => ({
      default: Probe,
    })) as unknown as typeof original
    try {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/playground/merkle-proof?step=2']}>
          <Routes>
            <Route path="/playground/:toolId" element={<PlaygroundToolRoute />} />
          </Routes>
        </MemoryRouter>
      )
      expect(await screen.findByText('probe step 2')).toBeInTheDocument()
      unmount()
      render(
        <MemoryRouter initialEntries={['/playground/merkle-proof?step=abc']}>
          <Routes>
            <Route path="/playground/:toolId" element={<PlaygroundToolRoute />} />
          </Routes>
        </MemoryRouter>
      )
      expect(await screen.findByText('probe step undefined')).toBeInTheDocument()
    } finally {
      TOOL_COMPONENTS['merkle-proof'] = original
    }
  })
})

describe('Crypto Lab command palette', () => {
  const tools = WORKSHOP_TOOLS.filter((t) => !t.sandbox)
  const openPalette = (onPickPlayground = vi.fn()) => {
    render(
      <CommandPalette
        tools={tools}
        onClose={vi.fn()}
        onPickTool={vi.fn()}
        onPickVerb={vi.fn()}
        onPickPlayground={onPickPlayground}
      />
    )
    return onPickPlayground
  }

  it('finds the ML-KEM tools by the nickname "kyber"', () => {
    openPalette()
    fireEvent.change(screen.getByLabelText('Search the Crypto Lab'), {
      target: { value: 'kyber' },
    })
    expect(screen.queryByText(/No matches/)).not.toBeInTheDocument()
    const mlKemNames = tools
      .filter((t) => t.algorithms.some((a) => a.toUpperCase().includes('ML-KEM')))
      .map((t) => t.name)
    const shown = screen.getAllByRole('option').map((o) => o.textContent ?? '')
    expect(shown.some((text) => mlKemNames.some((name) => text.includes(name)))).toBe(true)
  })

  it('lists the three in-browser full playgrounds and opens one', () => {
    const onPick = openPalette()
    expect(screen.getByText('Full playgrounds')).toBeInTheDocument()
    expect(screen.getByText('Interactive Playground')).toBeInTheDocument()
    expect(screen.getByText('PKCS#11 HSM')).toBeInTheDocument()
    expect(screen.getByText('KMIP Control Plane')).toBeInTheDocument()
    expect(screen.queryByText('Developer Sandbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('PKCS#11 HSM'))
    expect(onPick).toHaveBeenCalledWith('/playground/hsm')
  })
})

describe('phone Crypto Lab tab', () => {
  it('opens a tool on its own page and offers the same tools as the phone catalog', () => {
    render(
      <MemoryRouter initialEntries={['/playground/interactive']}>
        <Routes>
          <Route path="/playground/interactive" element={<WorkshopToolsTab />} />
          <Route path="/playground/:toolId" element={<Where />} />
        </Routes>
      </MemoryRouter>
    )
    for (const id of DROPPED_TOOL_IDS) {
      const tool = WORKSHOP_TOOLS.find((t) => t.id === id)
      const buttons = screen.queryAllByRole('button')
      expect(buttons.some((b) => (b.textContent ?? '').startsWith(tool!.name))).toBe(false)
    }
    const target = WORKSHOP_TOOLS.find((t) => t.id === 'merkle-proof')!
    fireEvent.click(screen.getByText(target.name))
    expect(screen.getByTestId('where')).toHaveTextContent('/playground/merkle-proof')
  })
})
