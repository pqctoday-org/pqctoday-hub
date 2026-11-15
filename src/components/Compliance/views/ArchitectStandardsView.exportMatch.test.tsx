// SPDX-License-Identifier: AGPL-3.0-only
// View-level check: every framework the Architect For You view renders, by region and in
// order, is a row the For You export lists for that persona, and nothing else is rendered.
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { TIER_META, type ApplicabilityResult } from '@/utils/applicabilityEngine'
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

// The title the view gives each framework's button: its label, plus its tier when the tier is known.
function titleFor(label: string, tier: string | undefined): string {
  const meta = tier ? TIER_META[tier as keyof typeof TIER_META] : undefined
  return meta ? `${label} — ${meta.label}: ${meta.description}` : label
}

describe('Architect For You: the view and the export list the same rows', () => {
  it('renders exactly the export rows, region by region and in order', () => {
    const { container } = render(
      <MemoryRouter>
        <ArchitectStandardsView />
      </MemoryRouter>
    )
    const exported = forYouViewRows('architect', hook.results, [])
    expect(exported.length).toBeGreaterThan(0)

    const expected = exported.map((r) => `${r.section}|${titleFor(r.label, r.tier)}`)

    // Every framework button the view renders, with its region, in document order.
    const rendered: string[] = []
    for (const heading of Array.from(container.querySelectorAll('h4'))) {
      const region = heading.textContent ?? ''
      const panel = heading.closest('.glass-panel')
      for (const li of Array.from(panel?.querySelectorAll('li') ?? [])) {
        const button = li.querySelector('[title]')
        if (!button) continue
        rendered.push(`${region}|${button.getAttribute('title') ?? ''}`)
      }
    }
    expect(rendered).toEqual(expected)
  })
})
