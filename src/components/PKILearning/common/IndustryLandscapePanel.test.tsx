// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapePanel } from './IndustryLandscapePanel'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { landscapeIndustriesForModule } from '@/components/Algorithms/landscapeLearnLinks'

const { useCases } = loadIndustryLandscape()

describe('IndustryLandscapePanel — landscape → Learn back-link', () => {
  it('every module a landscape row names gets at least one back-link, and none other does', () => {
    const named = new Set(useCases.map((u) => u.learnModuleId).filter(Boolean))
    expect(named.size).toBeGreaterThan(10)
    for (const moduleId of named) {
      const entries = landscapeIndustriesForModule(moduleId, useCases)
      expect(entries.length, `${moduleId}: no back-link`).toBeGreaterThan(0)
      for (const e of entries) {
        expect(e.href).toBe(`/algorithms?tab=landscape&industry=${encodeURIComponent(e.industry)}`)
        expect(e.useCaseLabels.length).toBeGreaterThan(0)
      }
    }
    expect(landscapeIndustriesForModule('pqc-101', useCases)).toEqual([])
  })

  it('renders the industries for a shared module and nothing for an unmapped one', () => {
    render(
      <MemoryRouter>
        <IndustryLandscapePanel moduleId="emv-payment-pqc" />
      </MemoryRouter>
    )
    const panel = screen.getByTestId('industry-landscape-panel')
    for (const ind of ['Payment Card Industry', 'Finance & Banking', 'Retail & E-Commerce']) {
      expect(panel).toHaveTextContent(ind)
    }
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(3)
  })

  it('renders nothing for a module no landscape row names', () => {
    const { container } = render(
      <MemoryRouter>
        <IndustryLandscapePanel moduleId="pqc-101" />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })
})
