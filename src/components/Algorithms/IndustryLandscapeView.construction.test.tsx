// SPDX-License-Identifier: AGPL-3.0-only
//
// The construction lens (2026-11-13): K11 (every count shown equals an
// independent count from the rows), K12 (?construction= deep links), K13
// (no construction chip shows zero; every listed use case names it). Real
// data, not fixtures, like the other landscape view tests.

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { CRYPTO_CONSTRUCTIONS } from '@/data/cryptoConstructions'
import { constructionUsage, constructionsInIndustry } from '@/data/constructionUsage'

const { useCases, standards } = loadIndustryLandscape()
const usage = constructionUsage(useCases, standards)

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/algorithms?tab=landscape${search}`]}>
      <IndustryLandscapeView />
    </MemoryRouter>
  )
}

/** Independent recount straight from the rows (K11). */
function recount(id: string) {
  const direct = useCases.filter(
    (u) => u.classicalConstructions.includes(id) || u.pqcConstructions.includes(id)
  )
  const std = standards.filter((s) => s.constructionsReferenced.includes(id))
  return {
    direct: direct.length,
    standards: std.length,
    industries: new Set(direct.map((u) => u.industry)).size,
  }
}

describe('construction usage counts (K11)', () => {
  it('every construction’s counts match a recount from the rows', () => {
    for (const c of CRYPTO_CONSTRUCTIONS) {
      const u = usage.get(c.id)!
      const r = recount(c.id)
      expect(u.direct.length, c.id).toBe(r.direct)
      expect(u.standards.length, c.id).toBe(r.standards)
      expect(u.industries.length, c.id).toBe(r.industries)
    }
  })

  it('every industry’s construction counts match a recount from the rows', () => {
    for (const ind of new Set(useCases.map((u) => u.industry)))
      for (const { id, count } of constructionsInIndustry(ind, usage)) {
        const n = useCases.filter(
          (u) =>
            u.industry === ind &&
            (u.classicalConstructions.includes(id) || u.pqcConstructions.includes(id))
        ).length
        expect(count, `${ind} / ${id}`).toBe(n)
      }
  })

  it('every use case listed under a construction names it (K13)', () => {
    for (const u of usage.values())
      for (const d of u.direct)
        expect(
          d.useCase.classicalConstructions.includes(u.id) ||
            d.useCase.pqcConstructions.includes(u.id),
          `${d.useCase.useCaseId} / ${u.id}`
        ).toBe(true)
  })

  it('no construction chip shows zero (K13)', () => {
    const zero = [...usage.values()]
      .filter((u) => u.direct.length + u.standards.length + u.inside.length === 0)
      .map((u) => u.id)
    expect(zero).toEqual([])
  })
})

describe('construction lens deep links (K12)', () => {
  it('?construction= with no id opens the lens with the transition map', () => {
    renderAt('&construction=')
    expect(screen.getByTestId('construction-chip-rows')).toBeInTheDocument()
    expect(screen.getByTestId('transition-map')).toBeInTheDocument()
  })

  it('?construction=HPKE shows its card, outlook, works-with strip and diagram', () => {
    renderAt('&construction=HPKE')
    const card = screen.getByTestId('construction-card-HPKE')
    expect(within(card).getByTestId('outlook-stays-both')).toBeInTheDocument()
    expect(within(card).getByTestId('construction-works-with')).toBeInTheDocument()
    expect(within(card).getByTestId('construction-diagram-HPKE')).toBeInTheDocument()
    expect(within(card).getByTestId('construction-usage-line')).toHaveTextContent(
      `Used in ${recount('HPKE').direct} use case`
    )
  })

  it('a replaced construction lists its successors with their context', () => {
    renderAt('&construction=ECIES')
    const succ = screen.getByTestId('construction-successors')
    expect(within(succ).getByTestId('construction-chip-HPKE')).toBeInTheDocument()
    expect(within(succ).getByTestId('construction-chip-PQ-SUCI-Profile')).toBeInTheDocument()
    expect(within(succ).getByTestId('status-research')).toBeInTheDocument()
  })

  it('an unknown construction id shows a not-found notice instead of a blank page', () => {
    renderAt('&construction=Not-A-Construction')
    expect(screen.getByText(/No construction matches "Not-A-Construction"/)).toBeInTheDocument()
    expect(screen.getByTestId('construction-chip-rows')).toBeInTheDocument()
  })

  it('an algorithm card lists the constructions built from it', () => {
    renderAt('&mechanism=ML-KEM')
    const inside = screen.getByTestId('lens-used-inside')
    expect(within(inside).getByTestId('construction-chip-Hybrid-KEM')).toBeInTheDocument()
  })
})
