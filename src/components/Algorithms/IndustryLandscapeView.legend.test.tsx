// SPDX-License-Identifier: AGPL-3.0-only
/** The PQC-mark legend under the Standards row of an industry rollup. Real landscape data. */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'

const { standards, useCases } = loadIndustryLandscape()
const withStandards = [...new Set(standards.map((s) => s.industry))][0]
const withoutStandards = [...new Set(useCases.map((u) => u.industry))].find(
  (i) => !standards.some((s) => s.industry === i)
)

const renderIndustry = (industry: string) =>
  render(
    <MemoryRouter
      initialEntries={[`/algorithms?tab=landscape&industry=${encodeURIComponent(industry)}`]}
    >
      <IndustryLandscapeView />
    </MemoryRouter>
  )

describe('IndustryLandscapeView — PQC mark legend', () => {
  it('shows the legend once under the Standards row of an industry that lists standards', () => {
    renderIndustry(withStandards)
    const legend = screen.getAllByTestId('standards-pqc-legend')
    expect(legend).toHaveLength(1)
    expect(legend[0]).toHaveTextContent(/PQC mark: the document names a post-quantum mechanism\./)
    expect(legend[0]).toHaveTextContent(/No mark does not mean no quantum content/)
  })

  it('never says a mark means the document specifies the mechanism or that it is final', () => {
    renderIndustry(withStandards)
    const text = screen.getByTestId('standards-pqc-legend').textContent ?? ''
    expect(text).not.toMatch(/specif(y|ies)|final|published/i)
  })

  it.skipIf(!withoutStandards)('is absent for an industry with no standards on record', () => {
    renderIndustry(withoutStandards as string)
    expect(screen.queryByTestId('standards-pqc-legend')).not.toBeInTheDocument()
  })
})
