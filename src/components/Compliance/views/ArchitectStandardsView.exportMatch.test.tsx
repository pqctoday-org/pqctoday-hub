// SPDX-License-Identifier: AGPL-3.0-only
// View-level check: the rows the Architect For You view renders, in order, are the rows the
// For You export lists for that persona.
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import type { ApplicabilityResult } from '@/utils/applicabilityEngine'
import { ArchitectStandardsView } from './ArchitectStandardsView'
import { forYouViewRows } from './forYouSelection'

const hook = vi.hoisted(() => ({
  results: [] as ApplicabilityResult<ComplianceFramework>[],
}))

vi.mock('../../../hooks/useApplicabilityWithPaths', () => ({
  useApplicabilityWithPaths: () => ({
    profile: { industry: 'Finance & Banking', country: 'Germany', region: 'eu' as const },
    isEmpty: false,
    frameworks: hook.results,
    library: [],
    threats: [],
    timeline: [],
    derivedFrameworks: [],
    droppedCounts: {
      frameworks: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      library: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      threats: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      timeline: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
    },
    lens: { sections: [], tierCaps: {}, framing: '' },
    allFrameworks: [],
  }),
}))

beforeAll(() => {
  const active = complianceFrameworks.filter((f) => f.status !== 'deprecated')
  const tiers = ['mandatory', 'recognized', 'cross-border', 'advisory'] as const
  hook.results = active.slice(0, 60).map((item, i) => ({
    item,
    tier: tiers[i % 4],
    reason: `reason ${i}`,
  }))
})

describe('Architect For You: the view and the export list the same rows', () => {
  it('renders each region and its frameworks in the order the export lists them', () => {
    const { container } = render(
      <MemoryRouter>
        <ArchitectStandardsView />
      </MemoryRouter>
    )
    const exported = forYouViewRows('architect', hook.results, []).map((r) => ({
      region: r.section,
      label: r.label,
    }))
    expect(exported.length).toBeGreaterThan(0)

    const rendered: { region: string; label: string }[] = []
    for (const heading of Array.from(container.querySelectorAll('h4'))) {
      const region = heading.textContent ?? ''
      const panel = heading.closest('.glass-panel')
      const items = Array.from(panel?.querySelectorAll('li') ?? [])
      for (const li of items) {
        // Each framework's button carries its label in its title: match exactly, not by prefix.
        const title = li.querySelector('[title]')?.getAttribute('title') ?? ''
        const row = exported.find(
          (e) => e.region === region && (title === e.label || title.startsWith(`${e.label} — `))
        )
        if (row) rendered.push({ region, label: row.label })
      }
    }
    expect(rendered).toEqual(exported)
  })
})
