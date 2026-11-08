// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The regulatory row of an industry rollup counts register records that are
 * PQC-relevant (yes, expected or partial). It must not call them mandates:
 * an expected or partial record is not a binding requirement.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { regulatoryFor } from './industryCrossRefs'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'

const { useCases } = loadIndustryLandscape()
const industries = [...new Set(useCases.map((u) => u.industry))]
const withRecords = industries.find((i) => regulatoryFor(i).count > 0)
const withoutRecords = industries.find((i) => regulatoryFor(i).count === 0)

const renderIndustry = (industry: string) =>
  render(
    <MemoryRouter
      initialEntries={[`/algorithms?tab=landscape&industry=${encodeURIComponent(industry)}`]}
    >
      <IndustryLandscapeView />
    </MemoryRouter>
  )

describe('IndustryLandscapeView regulatory row', () => {
  it.skipIf(!withRecords)('calls the counted entries register records, not mandates', () => {
    renderIndustry(withRecords as string)
    const link = screen.getByRole('link', { name: /PQC-relevant register record/ })
    const count = regulatoryFor(withRecords as string).count
    expect(link).toHaveTextContent(String(count))
    expect(link).toHaveTextContent(/binding status and scope vary/)
    expect(link.textContent ?? '').not.toMatch(/mandate/i)
  })

  it.skipIf(!withoutRecords)(
    'does not claim an absence of mandates when the register has none',
    () => {
      renderIndustry(withoutRecords as string)
      expect(
        screen.getByText(/No PQC-relevant register records for this sector\./)
      ).toBeInTheDocument()
      expect(document.body.textContent ?? '').not.toMatch(/No PQC-specific mandates/)
    }
  )
})
