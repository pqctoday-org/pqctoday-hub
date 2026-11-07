// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoadmapBuilder, buildRoadmapMarkdown, milestoneStatus } from './RoadmapBuilder'
import type { ExternalMilestone } from './RoadmapBuilder'
import { useBookmarkStore } from '@/store/useBookmarkStore'

const event = (over: Record<string, unknown>) => ({
  startYear: 2030,
  endYear: 2030,
  type: 'Milestone',
  description: '',
  entityType: 'government',
  orgFullName: 'Org',
  countryName: 'Testland',
  flagCode: 'xx',
  ...over,
})

const countryDeadlines = [
  {
    countryName: 'Testland',
    flagCode: 'xx',
    bodies: [
      {
        name: 'Agency A',
        fullName: 'Agency A',
        countryCode: 'xx',
        events: [
          event({
            title: 'National PQC policy statement',
            phase: 'Policy',
            endYear: 2027,
            orgName: 'Agency A',
            mandateType: 'SOFT',
            sourceUrl: 'https://example.test/policy',
          }),
          event({
            title: 'Target: migrate key exchange',
            phase: 'Deadline',
            endYear: 2030,
            orgName: 'Agency A',
            bindingForce: 'official_target',
          }),
          event({
            title: 'Regulated sector deadline',
            phase: 'Deadline',
            endYear: 2031,
            orgName: 'Regulator C',
            bindingForce: 'mandatory_for_scope',
          }),
        ],
      },
    ],
  },
]

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ countryDeadlines, algorithmMigrations: [] }),
}))
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => [],
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: unknown) => unknown) => {
    const state = { addExecutiveDocument: vi.fn(), artifacts: { executiveDocuments: [] } }
    return selector ? selector(state) : state
  },
}))

describe('RoadmapBuilder: external milestones keep their own classification and are selected explicitly', () => {
  beforeEach(() => {
    useBookmarkStore.setState({ myTimelineCountries: ['Testland'] })
  })

  it('does not select anything because the country is bookmarked or filtered', () => {
    render(<RoadmapBuilder />)
    expect(screen.getByText(/External milestones \(0\/3 selected\)/)).toBeVisible()
    expect(screen.queryByText(/Regulatory deadlines/)).toBeNull()
  })

  it('shows each milestone with its own status and carries issuer, type and link on the chip', () => {
    render(<RoadmapBuilder />)
    const policy = screen.getByRole('button', { name: /National PQC policy statement/ })
    const target = screen.getByRole('button', { name: /Target: migrate key exchange/ })
    const scoped = screen.getByRole('button', { name: /Regulated sector deadline/ })
    expect(policy).toHaveTextContent('Recommendation / guidance')
    expect(policy.getAttribute('title')).toMatch(
      /Agency A · Policy publication · .*example\.test\/policy/
    )
    expect(target).toHaveTextContent('Official target (planning)')
    expect(scoped).toHaveTextContent('Mandatory for its stated scope')
    expect(scoped.getAttribute('title')).toMatch(/Regulator C · Deadline/)
    fireEvent.click(scoped)
    expect(screen.getByText(/External milestones \(1\/3 selected\)/)).toBeVisible()
  })

  it('says the list mixes policy, advisory and binding items and that a country listing does not decide applicability', () => {
    render(<RoadmapBuilder />)
    expect(
      screen.getByText(/mixes policy publications, advisory targets, and binding deadlines/)
    ).toBeVisible()
    expect(screen.getByText(/A country listing does not tell you which apply to you/)).toBeVisible()
  })

  it('exports a policy publication, an advisory target and a scoped deadline each with its own type, issuer and status', () => {
    const picks: ExternalMilestone[] = [
      {
        label: 'National PQC policy statement',
        year: 2027,
        source: 'Testland',
        issuer: 'Agency A',
        kind: 'Policy publication',
        status: milestoneStatus({ mandateType: 'SOFT' }),
      },
      {
        label: 'Target: migrate key exchange',
        year: 2030,
        source: 'Testland',
        issuer: 'Agency A',
        kind: 'Deadline',
        status: milestoneStatus({ bindingForce: 'official_target' }),
      },
      {
        label: 'Regulated sector deadline',
        year: 2031,
        source: 'Testland',
        issuer: 'Regulator C',
        kind: 'Deadline',
        status: milestoneStatus({ bindingForce: 'mandatory_for_scope' }),
      },
    ]
    const md = buildRoadmapMarkdown(picks, [], [])
    expect(md).not.toContain('External Regulatory Deadlines')
    expect(md).toContain('External Milestones Selected For This Plan')
    expect(md).toMatch(
      /\| 2027 \| National PQC policy statement \| Testland \| Agency A \| Policy publication \| Recommendation \/ guidance \|/
    )
    expect(md).toMatch(
      /\| 2030 \| Target: migrate key exchange \| Testland \| Agency A \| Deadline \| Official target \(planning\) \|/
    )
    expect(md).toMatch(
      /\| 2031 \| Regulated sector deadline \| Testland \| Regulator C \| Deadline \| Mandatory for its stated scope \|/
    )
    expect(md).toMatch(/planning input, not a legal deadline/)
  })

  it('an earlier saved selection without classification is shown as not classified, not as binding', () => {
    const md = buildRoadmapMarkdown(
      [{ label: 'Old pick', year: 2030, source: 'Elsewhere' }],
      [],
      []
    )
    expect(md).toMatch(/\| 2030 \| Old pick \| Elsewhere \| — \| — \| Not classified \|/)
  })
})

describe('RoadmapBuilder: the two tracks are lenses with shared dependencies, not a universal independence rule', () => {
  it('keeps the confidentiality/signature distinction and allows cross-track dependencies', () => {
    const { container } = render(<RoadmapBuilder />)
    const t = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(t).toMatch(/signatures have no equivalent passive harvest step/)
    expect(t).toMatch(
      /the work should start now, and any signature deadline or dependency you already have keeps its own date/
    )
    expect(t).toMatch(/Map the shared components, resources and dependencies for each service/)
    expect(t).toMatch(/cross-track dependencies/)
    expect(t).toMatch(/does not mean the tracks are independent in every estate/)
    expect(t).not.toMatch(/don't share deadlines or dependencies/)
    expect(t).not.toMatch(/not urgent today/)
  })
})
