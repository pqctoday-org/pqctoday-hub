// SPDX-License-Identifier: GPL-3.0-only
/**
 * W3-1 / W3-2 (audit 2026-08-10): a tool opened directly at
 * /business/tools/:id showed no standards provenance and no hub resources.
 * The registry has carried a validated cswp39SectionRef for all 37 tools the
 * whole time, and RecommendedResourcesPanel existed — both were only ever
 * rendered on the Command Center.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route } from 'react-router'
import { BusinessToolRoute } from './BusinessToolRoute'
import { BUSINESS_TOOLS } from './businessToolsRegistry'

vi.mock('@/utils/analytics', () => ({ logBusinessToolOpen: vi.fn() }))

function renderTool(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/business/tools/${id}`]}>
      <Routes>
        <Route path="/business/tools/:toolId" element={<BusinessToolRoute />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BusinessToolRoute — provenance and resources', () => {
  it('renders the tool’s CSWP.39 section reference', () => {
    const tool = BUSINESS_TOOLS.find((t) => t.id === 'policy-generator')!
    renderTool(tool.id)
    expect(screen.getByText(tool.cswp39SectionRef)).toBeInTheDocument()
  })

  it('renders the recommended-resources panel with in-app hub links', () => {
    renderTool('policy-generator')
    expect(screen.getByText(/Recommended resources/i)).toBeInTheDocument()
    expect(screen.getByText(/Examples in this app/i)).toBeInTheDocument()
  })

  it('resolves a step for every tool’s zone, so no tool renders a bare page', () => {
    // Guards the zone -> step resolution for all 37 tools at once.
    for (const tool of BUSINESS_TOOLS) {
      const { unmount } = renderTool(tool.id)
      expect(
        screen.getByText(/Recommended resources/i),
        `${tool.id} (zone ${tool.cswp39Zone}) rendered no resources panel`
      ).toBeInTheDocument()
      unmount()
    }
  })
})
