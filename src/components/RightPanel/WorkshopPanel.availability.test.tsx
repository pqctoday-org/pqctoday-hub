// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import manifest from '../../../public/workshop/index.json'
import type { WorkshopFlowManifest } from '@/services/workshopFlowLoader'

// Serve the manifest that actually ships, so the sentence is checked against it.
let served: WorkshopFlowManifest | null = manifest as unknown as WorkshopFlowManifest
vi.mock('@/hooks/useWorkshopManifest', () => ({
  useWorkshopManifest: () => ({
    manifest: served,
    isLoading: false,
    error: null,
    activeEntry: null,
    matchedEntry: null,
    compatibleEntries: [],
    activeFlow: null,
    retry: () => undefined,
  }),
}))

import { WorkshopPanel } from './WorkshopPanel'

const renderPanel = () =>
  render(
    <MemoryRouter>
      <WorkshopPanel />
    </MemoryRouter>
  )

describe('WorkshopPanel flow availability sentence', () => {
  beforeEach(() => {
    served = manifest as unknown as WorkshopFlowManifest
  })

  it('lists the roles the shipped manifest has flows for, and no longer calls published flows "in development"', () => {
    const { container } = renderPanel()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/are in development/i)
    expect(text).toMatch(/7 flows available\./)
    for (const role of [
      'Developer / Engineer',
      'IT Ops / DevOps',
      'Security Architect',
      'Researcher / Academic',
      'Curious Explorer',
      'Executive / Business Leader',
    ]) {
      expect(text, role).toContain(role)
    }
  })

  it('names the roles that still have no flow and says what they are offered instead', () => {
    const { container } = renderPanel()
    const text = container.textContent ?? ''
    // Roles with a flow of their own are not listed as missing; GRC and certification are.
    expect(text).toMatch(
      /Roles with none yet \(GRC \/ Risk & Compliance, Certification & Validation Engineer\) are offered the generic overview/
    )
  })

  it('keeps the industry limit of the Executive flow visible', () => {
    const { container } = renderPanel()
    expect(container.textContent).toMatch(
      /Written for specific industries only: Executive \/ Business Leader \(Finance & Banking\)/
    )
  })

  it('reads a single flow without the plural, and says nothing about missing roles when none are listed', () => {
    served = {
      ...(manifest as unknown as WorkshopFlowManifest),
      flows: [(manifest as unknown as WorkshopFlowManifest).flows[0]],
    }
    const { container } = renderPanel()
    expect(container.textContent).toMatch(/1 flow available\./)
  })
})
