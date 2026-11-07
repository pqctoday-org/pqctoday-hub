// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SensitivityConflictResolver } from './SensitivityConflictResolver'
import { CONFLICT_SCENARIOS, SENSITIVITY_TIERS } from '../data/sensitivityConstants'

const ALL_ROWS = CONFLICT_SCENARIOS.flatMap((s) =>
  s.conflictingRequirements.map((r) => ({ scenarioId: s.id, ...r }))
)

const rowContaining = (text: string): HTMLElement =>
  screen.getAllByRole('row').find((r) => r.textContent!.includes(text))!

describe('conflict resolver presents the tiers as sample policy', () => {
  it('does not present the four tiers as prescribed by the listed laws', () => {
    render(<SensitivityConflictResolver assets={[]} />)
    expect(screen.queryAllByText('Prescribed Tier')).toHaveLength(0)
    expect(screen.queryAllByText('Sample-Policy Tier')).toHaveLength(0)
    expect(screen.getAllByText("This module's tier").length).toBeGreaterThan(0)
    expect(screen.getAllByText('What the framework says').length).toBeGreaterThan(0)
    const intro = screen.getByText(/Challenge:/).closest('p')!.textContent!
    expect(intro).toMatch(/sample organizational policy/)
    expect(intro).toMatch(/none of these laws or\s+standards defines them/)
    expect(intro).toMatch(/scope\s+facts/)
    expect(intro).not.toMatch(/prescribe different sensitivity tiers/)
  })

  it('states that location alone does not make a law apply', () => {
    render(<SensitivityConflictResolver assets={[]} />)
    expect(screen.getByText(/Location alone is not enough/)).toBeInTheDocument()
    expect(screen.queryByText(/jurisdiction where each data subject resides/)).toBeNull()
  })
})

describe('conflict table keeps the framework wording apart from the module tier', () => {
  it('renders both column headings once per scenario table', () => {
    render(<SensitivityConflictResolver assets={[]} />)
    const frameworkHeadings = screen.getAllByText('What the framework says')
    const tierHeadings = screen.getAllByText("This module's tier")
    expect(frameworkHeadings).toHaveLength(CONFLICT_SCENARIOS.length)
    expect(tierHeadings).toHaveLength(CONFLICT_SCENARIOS.length)
    for (const h of [...frameworkHeadings, ...tierHeadings]) {
      expect(h.tagName).toBe('TH')
    }
  })

  it('has a non-empty framework text, rationale and valid module tier for every row', () => {
    const validTiers = SENSITIVITY_TIERS.map((t) => t.id)
    expect(ALL_ROWS.length).toBeGreaterThan(0)
    for (const r of ALL_ROWS) {
      const where = `${r.scenarioId} / ${r.framework}`
      expect(r.framework.trim(), where).not.toBe('')
      expect(r.frameworkSays.trim(), where).not.toBe('')
      expect(r.tierRationale.trim(), where).not.toBe('')
      expect(validTiers, where).toContain(r.moduleTier)
    }
  })

  it('keeps the module own tiering out of the framework column', () => {
    for (const r of ALL_ROWS) {
      const where = `${r.scenarioId} / ${r.framework}`
      expect(r.frameworkSays, where).not.toMatch(/module assumption/i)
      expect(r.frameworkSays, where).not.toMatch(/this module/i)
      expect(r.frameworkSays, where).not.toMatch(/sample policy/i)
    }
  })

  it('does not credit a framework with a tier it does not define', () => {
    for (const r of ALL_ROWS) {
      const where = `${r.scenarioId} / ${r.framework}`
      expect(r.frameworkSays, where).not.toMatch(
        /classifies .* as (low|medium|high) (risk|sensitivity)/i
      )
      expect(r.frameworkSays, where).not.toMatch(/\bmust be treated as High\b/)
    }
  })

  it('words every tier rationale as the module own reasoning', () => {
    for (const r of ALL_ROWS) {
      const where = `${r.scenarioId} / ${r.framework}`
      // Each rationale must name the module or its sample policy as the source of the tier.
      expect(r.tierRationale, where).toMatch(/module|sample/i)
      // It must not say that a law requires, mandates or prescribes the tier.
      expect(r.tierRationale, where).not.toMatch(
        /\b(requires?|required|mandates?|mandated|prescribes?|prescribed)\b/i
      )
    }
  })

  it('renders each row with the framework text and the rationale in separate cells', () => {
    render(<SensitivityConflictResolver assets={[]} />)
    const gdpr = ALL_ROWS.find((r) => r.framework === 'GDPR Art. 9')!
    const cells = within(rowContaining(gdpr.frameworkSays)).getAllByRole('cell')
    expect(cells).toHaveLength(3)
    // Second cell: the framework wording only.
    expect(cells[1].textContent).toBe(gdpr.frameworkSays)
    expect(cells[1].textContent).not.toContain(gdpr.tierRationale)
    // Third cell: the module tier badge, then the module's reasoning.
    const tierLabel = SENSITIVITY_TIERS.find((t) => t.id === gdpr.moduleTier)!.label
    expect(within(cells[2]).getByText(tierLabel)).toBeInTheDocument()
    expect(within(cells[2]).getByText(gdpr.tierRationale)).toBeInTheDocument()
    expect(cells[2].textContent).not.toContain(gdpr.frameworkSays)
  })

  it('stacks both texts under the framework name so no small screen hides them', () => {
    render(<SensitivityConflictResolver assets={[]} />)
    const fedramp = ALL_ROWS.find((r) => r.framework === 'FedRAMP High')!
    const firstCell = within(rowContaining(fedramp.frameworkSays)).getAllByRole('cell')[0]
    expect(within(firstCell).getByText(fedramp.frameworkSays)).toBeInTheDocument()
    expect(within(firstCell).getByText(fedramp.tierRationale)).toBeInTheDocument()
  })
})
