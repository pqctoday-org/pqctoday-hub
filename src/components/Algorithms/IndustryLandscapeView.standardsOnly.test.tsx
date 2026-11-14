// SPDX-License-Identifier: AGPL-3.0-only
//
// Constructions that only standards cite (2026-11-14). A construction no use
// case names must not open to an empty body: the view lists the use cases the
// citing standards link, says plainly that this is where the standards apply
// and not a deployment, and an industry whose standards cite constructions
// shows that apart from the constructions its use cases name. Real data, with
// every expectation recounted from the parsed rows.

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { ConstructionsOverview } from './ConstructionLens'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { CRYPTO_CONSTRUCTIONS } from '@/data/cryptoConstructions'
import {
  constructionUsage,
  constructionsCitedByIndustryStandards,
  constructionsInIndustry,
  linkedUseCasesFromStandards,
} from '@/data/constructionUsage'

const { useCases, standards } = loadIndustryLandscape()
const usage = constructionUsage(useCases, standards)

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/algorithms?tab=landscape${search}`]}>
      <IndustryLandscapeView />
    </MemoryRouter>
  )
}

const standardsOnly = CRYPTO_CONSTRUCTIONS.filter((c) => {
  const u = usage.get(c.id)!
  return u.direct.length === 0 && u.standards.length > 0
})

describe('linkedUseCasesFromStandards', () => {
  it('lists the use cases the citing standards link, once each, and never a direct one', () => {
    for (const c of standardsOnly) {
      const u = usage.get(c.id)!
      const expected = new Set(
        standards
          .filter((s) => s.constructionsReferenced.includes(c.id))
          .flatMap((s) => s.useCaseIds)
          .filter((id) => useCases.some((x) => x.useCaseId === id))
      )
      const got = linkedUseCasesFromStandards(u, useCases)
      expect(got.map((g) => g.useCase.useCaseId).sort(), c.id).toEqual([...expected].sort())
    }
  })

  it('leaves out a use case that already names the construction', () => {
    const hk = usage.get('Hybrid-KEM')!
    const named = new Set(hk.direct.map((d) => d.useCase.useCaseId))
    const linked = linkedUseCasesFromStandards(hk, useCases)
    for (const l of linked) expect(named.has(l.useCase.useCaseId)).toBe(false)
  })

  it('returns nothing for an unknown construction', () => {
    expect(linkedUseCasesFromStandards(undefined, useCases)).toEqual([])
  })
})

describe('constructionsCitedByIndustryStandards', () => {
  it('counts the industry’s own standards that cite each construction', () => {
    for (const ind of new Set(standards.map((s) => s.industry)))
      for (const { id, count } of constructionsCitedByIndustryStandards(ind, usage))
        expect(count, `${ind} / ${id}`).toBe(
          standards.filter((s) => s.industry === ind && s.constructionsReferenced.includes(id))
            .length
        )
  })
})

describe('a construction only standards cite', () => {
  it('exists in the data, so the guards below are not vacuous', () => {
    expect(standardsOnly.length).toBeGreaterThan(0)
  })

  it('does not open to an empty body: it says so and lists the linked use cases', () => {
    for (const c of standardsOnly) {
      const { unmount } = renderAt(`&construction=${c.id}`)
      const block = screen.getByTestId('construction-standard-links')
      expect(within(block).getByText('Use cases linked from the citing standards')).toBeVisible()
      expect(block.textContent).toMatch(/not use cases that run or plan this construction/)
      expect(screen.getByTestId('construction-standards')).toBeInTheDocument()
      const linked = linkedUseCasesFromStandards(usage.get(c.id), useCases)
      if (linked.length === 0) expect(block.textContent).toMatch(/do not link a use case yet/)
      for (const l of linked) expect(within(block).getByText(l.useCase.useCaseLabel)).toBeVisible()
      // The card still reports zero direct use cases: the list is not counted as use.
      expect(screen.getByTestId('construction-usage-line').textContent).toMatch(
        /Used in 0 use cases/
      )
      unmount()
    }
  })

  it('is not shown for a construction with no direct use case and no citing standard', () => {
    const bare = CRYPTO_CONSTRUCTIONS.filter((c) => {
      const u = usage.get(c.id)!
      return u.direct.length === 0 && u.standards.length === 0
    })
    expect(bare.length).toBeGreaterThan(0)
    for (const c of bare) {
      const { unmount } = renderAt(`&construction=${c.id}`)
      expect(screen.getByTestId(`construction-card-${c.id}`)).toBeInTheDocument()
      expect(screen.queryByTestId('construction-standard-links')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('is not shown for a construction that use cases name', () => {
    renderAt('&construction=HPKE')
    expect(screen.queryByTestId('construction-standard-links')).not.toBeInTheDocument()
  })
})

describe('industries whose standards cite constructions', () => {
  it('the industry view lists them apart from the ones its use cases name', () => {
    let checked = 0
    for (const ind of new Set(standards.map((s) => s.industry))) {
      const named = new Set(constructionsInIndustry(ind, usage).map((r) => r.id))
      const expected = constructionsCitedByIndustryStandards(ind, usage).filter(
        (r) => !named.has(r.id)
      )
      if (expected.length === 0) continue
      checked += 1
      const { unmount } = renderAt(`&industry=${encodeURIComponent(ind)}`)
      const row = screen.getByTestId('industry-standard-constructions')
      for (const { id, count } of expected) {
        const chip = within(row).getByTestId(`construction-chip-${id}`)
        expect(chip, `${ind} / ${id}`).toBeVisible()
        // What the number counts is written out, not only in a hover title.
        expect(chip.textContent, `${ind} / ${id}`).toContain(
          `${count} standard${count === 1 ? '' : 's'}`
        )
      }
      unmount()
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('the overview names industries that have no use-case construction but cite some in standards', () => {
    render(
      <MemoryRouter>
        <ConstructionsOverview
          industries={[...new Set(useCases.map((u) => u.industry))]}
          usage={usage}
          onPick={() => {}}
        />
      </MemoryRouter>
    )
    const withRows = new Set(
      useCases
        .filter((u) => u.classicalConstructions.length + u.pqcConstructions.length > 0)
        .map((u) => u.industry)
    )
    const expected = [...new Set(useCases.map((u) => u.industry))].filter(
      (ind) => !withRows.has(ind) && constructionsCitedByIndustryStandards(ind, usage).length > 0
    )
    if (expected.length === 0) {
      expect(screen.queryByTestId('constructions-overview-standards-only')).not.toBeInTheDocument()
      return
    }
    const block = screen.getByTestId('constructions-overview-standards-only')
    for (const ind of expected)
      expect(within(block).getByTestId(`standards-only-${ind}`)).toBeInTheDocument()
    expect(block.textContent).toMatch(/in sector standards/)
    expect(block.textContent).toMatch(/\d+ standards?/)
  })
})
