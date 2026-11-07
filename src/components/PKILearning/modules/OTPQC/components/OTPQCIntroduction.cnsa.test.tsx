// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The per-category CNSA 2.0 table in the regulations section is the 2022 chart. The reader must
 * see that it is older guidance and must not see the FAQ's mandate year under the 2022 label.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { OTPQCIntroduction } from './OTPQCIntroduction'

function renderIntro(section = 'regulations') {
  return render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[`/learn/ot-pqc?section=${section}`]}>
        <OTPQCIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
}

describe('OTPQC introduction: CNSA 2.0 per-category table', () => {
  it('says on the page that the table is the 2022 guidance, superseded by the FAQ dates', () => {
    renderIntro()
    const heading = screen.getByRole('heading', { name: /CNSA 2\.0 — per-category dates/ })
    expect(heading).toHaveTextContent(
      /NSA's 2022 category guidance; superseded for planning by the dates in NSA's CNSA 2\.0 FAQ, version 2\.2/
    )
  })

  it('shows the 2022 values: operating systems exclusive 2033, no all-systems row', () => {
    renderIntro()
    const row = screen.getByRole('row', { name: /Operating systems/ })
    expect(row).toHaveTextContent('2027')
    expect(row).toHaveTextContent('2033')
    expect(row).not.toHaveTextContent('2031')
    expect(screen.queryByText('All National Security Systems')).not.toBeInTheDocument()
  })

  it('gives the three FAQ dates as the current schedule in the signing section', () => {
    const { container } = renderIntro('firmware-project-signing')
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/sets three dates for national security systems/)
    expect(text).toContain('1 January 2027')
    expect(text).toContain('31 December 2030')
    expect(text).toContain('31 December 2031')
  })

  it('calls the table history and does not say each category has its own date as a present fact', () => {
    const { container } = renderIntro()
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/This table is history: it shows three categories from NSA's 2022 chart/)
    expect(text).toMatch(/each category had its own dates/)
    expect(text).not.toMatch(/each category has its own\./)
  })
})
