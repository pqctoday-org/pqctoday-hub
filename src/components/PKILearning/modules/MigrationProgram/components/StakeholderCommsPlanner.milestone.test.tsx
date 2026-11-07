// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import {
  StakeholderCommsPlanner,
  buildCommsSections,
  describeMilestone,
} from './StakeholderCommsPlanner'

const seed = (opts: Parameters<typeof buildCommsSections>[0]) => {
  const sections = buildCommsSections(opts)
  const field = (sectionId: string, fieldId: string) =>
    String(
      sections.find((s) => s.id === sectionId)!.fields.find((f) => f.id === fieldId)!.defaultValue
    )
  return {
    board: field('message-framework', 'board-message'),
    concerns: field('stakeholder-map', 'stakeholder-concerns'),
    triggers: field('escalation-criteria', 'escalation-triggers'),
  }
}

const base = {
  industry: 'Finance',
  country: 'Testland',
  myFrameworksLabels: [],
  myProductsCount: 0,
  deadlineYear: 2030,
  deadlineTitle: 'Target: migrate key exchange',
}

describe('Stakeholder comms: a country milestone is not turned into a binding deadline or regulatory exposure', () => {
  it('seeds a planning target as guidance, keeping the milestone title, with no regulatory exposure', () => {
    const s = seed({ ...base, deadlineBinding: false })
    const all = `${s.board} ${s.concerns} ${s.triggers}`
    expect(s.board).toMatch(
      /2030 \(Target: migrate key exchange\) date is a planning target or advisory milestone, not a binding deadline/
    )
    expect(s.concerns).toMatch(/planning target \(guidance, not a binding deadline\)/)
    expect(s.triggers).toMatch(
      /Slip risk against the 2030 \(Target: migrate key exchange\) planning target/
    )
    expect(all).not.toMatch(/Regulatory exposure if we miss/)
    expect(all).not.toMatch(/regulatory deadline/i)
  })

  it('seeds a binding milestone as conditional on its stated scope covering the organisation', () => {
    const s = seed({ ...base, deadlineBinding: true })
    expect(s.board).toMatch(
      /If the 2030 \(Target: migrate key exchange\) milestone applies to our systems, missing it carries regulatory exposure\. Applicability is to be confirmed/
    )
    expect(s.concerns).toMatch(/listed as binding for its stated scope, covers our systems/)
    expect(s.triggers).toMatch(/if it applies to us/)
  })

  it('does not seed a deadline at all when there is no milestone', () => {
    const s = seed({ ...base, deadlineYear: null })
    expect(`${s.board}${s.concerns}${s.triggers}`).not.toMatch(/2030/)
  })

  it('the on-screen introduction names the milestone and its classification instead of "your earliest regulatory deadline"', () => {
    const text = describeMilestone({ year: 2030, title: 'Target', binding: false }).intro
    expect(text).toMatch(/guidance or a planning target rather than a binding deadline/)
    expect(describeMilestone({ year: 2030, title: 'Rule', binding: true }).intro).toMatch(
      /confirm that it covers your systems before treating it as your deadline/
    )
  })
})

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    industry: 'Finance',
    country: '',
    migrationDeadlineYear: 2031,
    migrationDeadlineBinding: false,
    userCountryData: null,
    myFrameworks: [],
    myProducts: [],
    frameworks: [],
  }),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (s: unknown) => unknown) => {
    const state = { addExecutiveDocument: vi.fn(), artifacts: { executiveDocuments: [] } }
    return selector ? selector(state) : state
  },
}))

describe('Stakeholder comms planner screen', () => {
  it('does not call the next timeline milestone a regulatory deadline', () => {
    const { container } = render(<StakeholderCommsPlanner />)
    const t = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(t).not.toMatch(/Your earliest regulatory deadline is/)
    expect(t).toMatch(/guidance or a planning target rather than a binding deadline/)
    expect(t).toMatch(/2031 milestone from \/timeline/)
  })
})
